import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

interface ApproveRentalRequest {
  rental_id: string;
  owner_message?: string;
  confirm?: boolean;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing Authorization header" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return jsonResponse({ error: "Invalid or expired token" }, 401);

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("id, role").eq("id", user.id).single();
    if (profileError || !profile) return jsonResponse({ error: "Profile not found" }, 404);
    if (profile.role !== "owner") return jsonResponse({ error: "Only owners can approve rentals" }, 403);

    const body: ApproveRentalRequest = await req.json();
    const { rental_id, owner_message, confirm } = body;
    if (!rental_id) return jsonResponse({ error: "rental_id is required" }, 400);

    // Fetch rental
    const { data: rental, error: fetchError } = await supabase
      .from("rentals")
      .select("id, user_id, band_or_event_name, start_datetime, end_datetime, status")
      .eq("id", rental_id).single();

    if (fetchError || !rental) return jsonResponse({ error: "Rental not found" }, 404);
    if (rental.status !== "pending") {
      return jsonResponse({ error: `Rental is no longer pending (current status: ${rental.status})` }, 400);
    }

    // Fetch rental items
    const { data: rentalItems } = await supabase
      .from("rental_request_items").select("id, item_id, quantity")
      .eq("rental_id", rental_id);

    const rentalName = rental.band_or_event_name ?? "Alquiler";

    // Phase 1: Check conflicts
    if (!confirm) {
      // 1. Check item availability against CONFIRMED rentals + CONFIRMED reservation add-ons
      if (rentalItems && rentalItems.length > 0) {
        for (const ri of rentalItems) {
          const { data: item } = await supabase.from("items").select("id, name, quantity").eq("id", ri.item_id).single();
          if (!item) continue;

          const { data: confirmedRentalItems } = await supabase
            .from("rental_request_items")
            .select("quantity, rentals!inner(start_datetime, end_datetime, status)")
            .eq("item_id", ri.item_id).eq("rentals.status", "confirmed").neq("rental_id", rental_id)
            .lt("rentals.start_datetime", rental.end_datetime).gt("rentals.end_datetime", rental.start_datetime);

          const { data: confirmedResItems } = await supabase
            .from("reservation_items")
            .select("quantity, reservations!inner(start_time, end_time, status)")
            .eq("item_id", ri.item_id).eq("reservations.status", "confirmed")
            .lt("reservations.start_time", rental.end_datetime).gt("reservations.end_time", rental.start_datetime);

          const usedRentals = confirmedRentalItems?.reduce((s: number, c: any) => s + c.quantity, 0) ?? 0;
          const usedRes = confirmedResItems?.reduce((s: number, c: any) => s + c.quantity, 0) ?? 0;
          const available = item.quantity - usedRentals - usedRes;

          if (ri.quantity > available) {
            return jsonResponse({
              error: `Item '${item.name}' is not available for this time slot`,
              unavailable_items: [{ item_id: ri.item_id, name: item.name, requested: ri.quantity, available }],
            }, 409);
          }
        }
      }

      // 2. Same-type conflicts: overlapping pending rentals with same items (will auto-deny)
      let conflictIds: string[] = [];
      if (rentalItems && rentalItems.length > 0) {
        const itemIds = rentalItems.map((ri: any) => ri.item_id);

        const { data: overlappingRentals } = await supabase
          .from("rentals")
          .select("id, rental_request_items!inner(item_id)")
          .eq("status", "pending").neq("id", rental_id)
          .lt("start_datetime", rental.end_datetime).gt("end_datetime", rental.start_datetime);

        if (overlappingRentals) {
          conflictIds = overlappingRentals
            .filter((r: any) => {
              const items = r.rental_request_items ?? [];
              return items.some((ri: any) => itemIds.includes(ri.item_id));
            })
            .map((r: any) => r.id);
        }
      }

      // 3. Cross-type conflicts: check if pending RESERVATIONS have same items as add-ons
      let crossConflictIds: string[] = [];
      if (rentalItems && rentalItems.length > 0) {
        const itemIds = rentalItems.map((ri: any) => ri.item_id);

        const { data: conflictingReservations } = await supabase
          .from("reservations")
          .select("id, reservation_items!inner(item_id)")
          .eq("status", "pending")
          .lt("start_time", rental.end_datetime).gt("end_time", rental.start_datetime);

        if (conflictingReservations) {
          crossConflictIds = conflictingReservations
            .filter((r: any) => {
              const items = r.reservation_items ?? [];
              return items.some((ri: any) => itemIds.includes(ri.item_id));
            })
            .map((r: any) => r.id);
        }
      }

      const crossMsg = crossConflictIds.length > 0
        ? `Also, ${crossConflictIds.length} pending room reservation(s) include the same items as add-ons during this time.`
        : "";

      const msgParts: string[] = [];
      if (conflictIds.length > 0) {
        msgParts.push(`Approving will auto-deny ${conflictIds.length} other pending rental(s) with overlapping items.`);
      }
      if (crossMsg) msgParts.push(crossMsg);
      if (msgParts.length === 0) msgParts.push("No conflicts detected.");

      return jsonResponse({
        conflicts: conflictIds.length,
        conflict_ids: conflictIds,
        cross_conflicts: crossConflictIds.length,
        cross_conflict_ids: crossConflictIds,
        cross_conflict_type: "reservation",
        message: msgParts.join(" "),
      });
    }

    // Phase 2: confirm = true
    // Re-check item availability
    if (rentalItems && rentalItems.length > 0) {
      for (const ri of rentalItems) {
        const { data: item } = await supabase.from("items").select("id, name, quantity").eq("id", ri.item_id).single();
        if (!item) continue;

        const { data: confirmedRentalItems } = await supabase
          .from("rental_request_items")
          .select("quantity, rentals!inner(start_datetime, end_datetime, status)")
          .eq("item_id", ri.item_id).eq("rentals.status", "confirmed").neq("rental_id", rental_id)
          .lt("rentals.start_datetime", rental.end_datetime).gt("rentals.end_datetime", rental.start_datetime);

        const { data: confirmedResItems } = await supabase
          .from("reservation_items")
          .select("quantity, reservations!inner(start_time, end_time, status)")
          .eq("item_id", ri.item_id).eq("reservations.status", "confirmed")
          .lt("reservations.start_time", rental.end_datetime).gt("reservations.end_time", rental.start_datetime);

        const usedRentals = confirmedRentalItems?.reduce((s: number, c: any) => s + c.quantity, 0) ?? 0;
        const usedRes = confirmedResItems?.reduce((s: number, c: any) => s + c.quantity, 0) ?? 0;

        if (ri.quantity > item.quantity - usedRentals - usedRes) {
          return jsonResponse({
            error: `Item '${item.name}' is not available for this time slot`,
            unavailable_items: [{ item_id: ri.item_id, name: item.name, requested: ri.quantity, available: item.quantity - usedRentals - usedRes }],
          }, 409);
        }
      }
    }

    // Update to confirmed
    const { error: updateError } = await supabase
      .from("rentals")
      .update({ status: "confirmed", owner_message: owner_message ?? null, updated_at: new Date().toISOString() })
      .eq("id", rental_id);
    if (updateError) return jsonResponse({ error: "Failed to confirm rental" }, 500);

    // Auto-deny overlapping pending rentals with same items
    let autoDeniedIds: string[] = [];
    if (rentalItems && rentalItems.length > 0) {
      const itemIds = rentalItems.map((ri: any) => ri.item_id);

      const { data: overlappingRentalsDeny } = await supabase
        .from("rentals")
        .select("id, user_id, rental_request_items!inner(item_id)")
        .eq("status", "pending").neq("id", rental_id)
        .lt("start_datetime", rental.end_datetime).gt("end_datetime", rental.start_datetime);

      if (overlappingRentalsDeny) {
        const conflicting = overlappingRentalsDeny.filter((r: any) => {
          const items = r.rental_request_items ?? [];
          return items.some((ri: any) => itemIds.includes(ri.item_id));
        });

        autoDeniedIds = conflicting.map((r: any) => r.id);

        if (autoDeniedIds.length > 0) {
          await supabase.from("rentals")
            .update({ status: "denied", owner_message: "Otro alquiler fue confirmado para este horario.", updated_at: new Date().toISOString() })
            .in("id", autoDeniedIds);

          const dt = new Date(rental.start_datetime).toLocaleString("es-AR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
          const notifs = conflicting.map((r: any) => ({
            user_id: r.user_id, type: "rental_denied",
            message: `Tu alquiler (${rentalName}) para ${dt} ha sido denegado porque otro alquiler fue confirmado para el mismo horario.`,
            owner_message: "Otro alquiler fue confirmado para este horario.",
          }));
          await supabase.from("notifications").insert(notifs);
        }
      }
    }

    // Notify approved user
    const dtApproved = new Date(rental.start_datetime).toLocaleString("es-AR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    await supabase.from("notifications").insert({
      user_id: rental.user_id,
      type: "rental_confirmed",
      message: `Tu alquiler (${rentalName}) para ${dtApproved} ha sido confirmado.`,
      owner_message: owner_message ?? null,
    });

    return jsonResponse({ success: true, auto_denied_count: autoDeniedIds.length, auto_denied_ids: autoDeniedIds });
  } catch (err) {
    console.error("approve-rental error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
