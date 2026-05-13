import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

interface ApproveRentalRequest {
  rental_id: string;
  owner_message?: string;
  confirm?: boolean;
}

interface RentalRow {
  id: string;
  user_id: string;
  band_or_event_name: string | null;
  details: string | null;
  start_datetime: string;
  end_datetime: string;
  status: string;
  total_price: number;
  owner_message: string | null;
}

interface RentalRequestItemRow {
  id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
}

interface ItemRow {
  id: string;
  name: string;
  quantity: number;
}

interface ProfileRow {
  id: string;
  role: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is owner
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single<ProfileRow>();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.role !== "owner") {
      return new Response(JSON.stringify({ error: "Only owners can approve rentals" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ApproveRentalRequest = await req.json();
    const { rental_id, owner_message, confirm } = body;

    if (!rental_id) {
      return new Response(JSON.stringify({ error: "rental_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch rental
    const { data: rental, error: fetchError } = await supabase
      .from("rentals")
      .select("id, user_id, band_or_event_name, details, start_datetime, end_datetime, status, total_price, owner_message")
      .eq("id", rental_id)
      .single<RentalRow>();

    if (fetchError || !rental) {
      return new Response(JSON.stringify({ error: "Rental not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Race condition guard
    if (rental.status !== "pending") {
      return new Response(
        JSON.stringify({ error: `Rental is no longer pending (current status: ${rental.status})` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch rental request items
    const { data: rentalItems, error: itemsError } = await supabase
      .from("rental_request_items")
      .select("id, item_id, quantity, unit_price")
      .eq("rental_id", rental_id);

    if (itemsError) {
      return new Response(JSON.stringify({ error: "Failed to fetch rental items" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Phase 1: Check conflicts without modifying
    if (!confirm) {
      // Check item availability against confirmed rentals and confirmed reservation add-ons
      if (rentalItems && rentalItems.length > 0) {
        const unavailableItems: { item_id: string; name: string; requested: number; available: number }[] = [];

        for (const ri of rentalItems) {
          const { data: item, error: itemError } = await supabase
            .from("items")
            .select("id, name, quantity")
            .eq("id", ri.item_id)
            .single<ItemRow>();

          if (itemError || !item) continue;

          // Count committed units from confirmed rental_request_items
          const { data: confirmedRentalItems } = await supabase
            .from("rental_request_items")
            .select("quantity, rentals!inner(start_datetime, end_datetime, status)")
            .eq("item_id", ri.item_id)
            .eq("rentals.status", "confirmed")
            .neq("rental_id", rental_id)
            .lt("rentals.start_datetime", rental.end_datetime)
            .gt("rentals.end_datetime", rental.start_datetime);

          // Count committed units from confirmed reservation_items (add-ons)
          const { data: confirmedReservationItems } = await supabase
            .from("reservation_items")
            .select("quantity, reservations!inner(start_time, end_time, status)")
            .eq("item_id", ri.item_id)
            .eq("reservations.status", "confirmed")
            .lt("reservations.start_time", rental.end_datetime)
            .gt("reservations.end_time", rental.start_datetime);

          const committedFromRentals = confirmedRentalItems?.reduce((sum, ci) => sum + ci.quantity, 0) ?? 0;
          const committedFromReservations = confirmedReservationItems?.reduce((sum, ci) => sum + ci.quantity, 0) ?? 0;
          const committedUnits = committedFromRentals + committedFromReservations;
          const available = item.quantity - committedUnits;

          if (ri.quantity > available) {
            unavailableItems.push({
              item_id: ri.item_id,
              name: item.name,
              requested: ri.quantity,
              available,
            });
          }
        }

        if (unavailableItems.length > 0) {
          return new Response(
            JSON.stringify({
              error: `Item '${unavailableItems[0].name}' is not available for this time slot`,
              unavailable_items: unavailableItems,
            }),
            { status: 409, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      // Find overlapping pending rentals for the same items
      const { data: overlappingPending, error: overlapError } = await supabase
        .from("rentals")
        .select("id, rental_request_items!inner(item_id)")
        .eq("status", "pending")
        .neq("id", rental_id)
        .lt("start_datetime", rental.end_datetime)
        .gt("end_datetime", rental.start_datetime);

      if (overlapError) {
        return new Response(JSON.stringify({ error: "Failed to check overlapping rentals" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Filter to those requesting overlapping items
      const rentalItemIds = rentalItems?.map((ri) => ri.item_id) ?? [];
      const conflictingRentals = overlappingPending?.filter((rental: any) => {
        const items = rental.rental_request_items ?? [];
        return items.some((ri: any) => rentalItemIds.includes(ri.item_id));
      }) ?? [];

      const conflictIds = conflictingRentals.map((r: any) => r.id);
      const message =
        conflictIds.length > 0
          ? `Approving this rental will automatically deny ${conflictIds.length} other pending rental(s) for overlapping items and time slots.`
          : "No conflicts detected.";

      return new Response(
        JSON.stringify({
          conflicts: conflictIds.length,
          conflict_ids: conflictIds,
          message,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Phase 2: confirm = true — perform the approval
    // Re-check item availability
    if (rentalItems && rentalItems.length > 0) {
      for (const ri of rentalItems) {
        const { data: item, error: itemError } = await supabase
          .from("items")
          .select("id, name, quantity")
          .eq("id", ri.item_id)
          .single<ItemRow>();

        if (itemError || !item) continue;

        const { data: confirmedRentalItems } = await supabase
          .from("rental_request_items")
          .select("quantity, rentals!inner(start_datetime, end_datetime, status)")
          .eq("item_id", ri.item_id)
          .eq("rentals.status", "confirmed")
          .neq("rental_id", rental_id)
          .lt("rentals.start_datetime", rental.end_datetime)
          .gt("rentals.end_datetime", rental.start_datetime);

        const { data: confirmedReservationItems } = await supabase
          .from("reservation_items")
          .select("quantity, reservations!inner(start_time, end_time, status)")
          .eq("item_id", ri.item_id)
          .eq("reservations.status", "confirmed")
          .lt("reservations.start_time", rental.end_datetime)
          .gt("reservations.end_time", rental.start_datetime);

        const committedFromRentals = confirmedRentalItems?.reduce((sum, ci) => sum + ci.quantity, 0) ?? 0;
        const committedFromReservations = confirmedReservationItems?.reduce((sum, ci) => sum + ci.quantity, 0) ?? 0;
        const committedUnits = committedFromRentals + committedFromReservations;
        const available = item.quantity - committedUnits;

        if (ri.quantity > available) {
          return new Response(
            JSON.stringify({
              error: `Item '${item.name}' is not available for this time slot`,
              unavailable_items: [{ item_id: ri.item_id, name: item.name, requested: ri.quantity, available }],
            }),
            { status: 409, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Update rental to confirmed
    const { error: updateError } = await supabase
      .from("rentals")
      .update({
        status: "confirmed",
        owner_message: owner_message ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rental_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to confirm rental" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find overlapping pending rentals for the same items
    const { data: overlappingPendingDeny } = await supabase
      .from("rentals")
      .select("id, user_id, rental_request_items!inner(item_id)")
      .eq("status", "pending")
      .neq("id", rental_id)
      .lt("start_datetime", rental.end_datetime)
      .gt("end_datetime", rental.start_datetime);

    const rentalItemIds = rentalItems?.map((ri) => ri.item_id) ?? [];
    const conflictingRentalsDeny = overlappingPendingDeny?.filter((rental: any) => {
      const items = rental.rental_request_items ?? [];
      return items.some((ri: any) => rentalItemIds.includes(ri.item_id));
    }) ?? [];

    const autoDeniedIds = conflictingRentalsDeny.map((r: any) => r.id);
    const autoDeniedUsers = conflictingRentalsDeny.map((r: any) => r.user_id);

    if (autoDeniedIds.length > 0) {
      // Auto-deny them
      await supabase
        .from("rentals")
        .update({
          status: "denied",
          owner_message: "Otro alquiler fue confirmado para este horario.",
          updated_at: new Date().toISOString(),
        })
        .in("id", autoDeniedIds);

      // Create notifications for auto-denied users
      const formatDateTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleString("es-AR", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      };

      const dateTimeStr = formatDateTime(rental.start_datetime);
      const rentalName = rental.band_or_event_name ?? "Alquiler";
      const autoDenyNotifications = autoDeniedUsers.map((uid) => ({
        user_id: uid,
        type: "rental_denied" as const,
        message: `Tu alquiler (${rentalName}) para ${dateTimeStr} ha sido denegado porque otro alquiler fue confirmado para el mismo horario.`,
        owner_message: "Otro alquiler fue confirmado para este horario.",
      }));

      await supabase.from("notifications").insert(autoDenyNotifications);
    }

    // Create notification for the approved user
    const formatDateTimeApproved = (iso: string) => {
      const d = new Date(iso);
      return d.toLocaleString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const dateTimeStrApproved = formatDateTimeApproved(rental.start_datetime);
    const rentalNameApproved = rental.band_or_event_name ?? "Alquiler";
    await supabase.from("notifications").insert({
      user_id: rental.user_id,
      type: "rental_confirmed",
      message: `Tu alquiler (${rentalNameApproved}) para ${dateTimeStrApproved} ha sido confirmado.`,
      owner_message: owner_message ?? null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        auto_denied_count: autoDeniedIds.length,
        auto_denied_ids: autoDeniedIds,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("approve-rental error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});