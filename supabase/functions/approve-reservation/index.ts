import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

interface ApproveRequest {
  reservation_id: string;
  owner_message?: string;
  confirm?: boolean;
}

interface ReservationRow {
  id: string;
  user_id: string;
  room_id: string;
  status: string;
  start_time: string;
  end_time: string;
  band_name: string | null;
  total_price: number;
  owner_message: string | null;
}

interface RoomRow {
  id: string;
  name: string;
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
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
      return jsonResponse({ error: "Invalid or expired token" }, 401);
    }

    // Verify caller is owner
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single<ProfileRow>();

    if (profileError || !profile) {
      return jsonResponse({ error: "Profile not found" }, 404);
    }

    if (profile.role !== "owner") {
      return jsonResponse({ error: "Only owners can approve reservations" }, 403);
    }

    const body: ApproveRequest = await req.json();
    const { reservation_id, owner_message, confirm } = body;

    if (!reservation_id) {
      return jsonResponse({ error: "reservation_id is required" }, 400);
    }

    // Fetch reservation
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, user_id, room_id, status, start_time, end_time, band_name, total_price, owner_message")
      .eq("id", reservation_id)
      .single<ReservationRow>();

    if (fetchError || !reservation) {
      return jsonResponse({ error: "Reservation not found" }, 404);
    }

    // Race condition guard: re-check status
    if (reservation.status !== "pending") {
      return jsonResponse(
        { error: `Reservation is no longer pending (current status: ${reservation.status})` },
        400
      );
    }

    // Fetch room name
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, name")
      .eq("id", reservation.room_id)
      .single<RoomRow>();

    if (roomError || !room) {
      return jsonResponse({ error: "Room not found" }, 404);
    }

    // Fetch reservation items
    const { data: reservationItems, error: itemsError } = await supabase
      .from("reservation_items")
      .select("id, item_id, quantity, unit_price")
      .eq("reservation_id", reservation_id);

    if (itemsError) {
      return jsonResponse({ error: "Failed to fetch reservation items" }, 500);
    }

    // Phase 1: Check conflicts without modifying
    if (!confirm) {
      // Check room availability against confirmed reservations
      const { data: roomConflicts, error: roomConflictError } = await supabase
        .from("reservations")
        .select("id, start_time, end_time")
        .eq("room_id", reservation.room_id)
        .eq("status", "confirmed")
        .neq("id", reservation_id)
        .lt("start_time", reservation.end_time)
        .gt("end_time", reservation.start_time);

      if (roomConflictError) {
        return jsonResponse({ error: "Failed to check room availability" }, 500);
      }

      if (roomConflicts && roomConflicts.length > 0) {
        return jsonResponse(
          { error: "Room is already booked for this time slot", conflicts: roomConflicts.length },
          409
        );
      }

      // Check add-on item availability
      if (reservationItems && reservationItems.length > 0) {
        const unavailableItems: { item_id: string; name: string; requested: number; available: number }[] = [];

        for (const ri of reservationItems) {
          const { data: item, error: itemError } = await supabase
            .from("items")
            .select("id, name, quantity")
            .eq("id", ri.item_id)
            .single<ItemRow>();

          if (itemError || !item) continue;

          // Count committed units from confirmed reservation_items with overlapping time
          const { data: confirmedItems, error: committedError } = await supabase
            .from("reservation_items")
            .select("quantity, reservations!inner(start_time, end_time, status)")
            .eq("item_id", ri.item_id)
            .eq("reservations.status", "confirmed")
            .neq("reservation_id", reservation_id)
            .lt("reservations.start_time", reservation.end_time)
            .gt("reservations.end_time", reservation.start_time);

          if (committedError) {
            return jsonResponse({ error: "Failed to check item availability" }, 500);
          }

          const committedUnits = confirmedItems?.reduce((sum, ci) => sum + ci.quantity, 0) ?? 0;
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
          return jsonResponse(
            {
              error: `Item '${unavailableItems[0].name}' is no longer available for this time slot`,
              unavailable_items: unavailableItems,
            },
            409
          );
        }
      }

      // Find overlapping pending reservations to auto-deny
      const { data: overlappingPending, error: overlapError } = await supabase
        .from("reservations")
        .select("id")
        .eq("room_id", reservation.room_id)
        .eq("status", "pending")
        .neq("id", reservation_id)
        .lt("start_time", reservation.end_time)
        .gt("end_time", reservation.start_time);

      if (overlapError) {
        return jsonResponse({ error: "Failed to check overlapping reservations" }, 500);
      }

      const conflictIds = overlappingPending?.map((r) => r.id) ?? [];
      const message =
        conflictIds.length > 0
          ? `Approving this reservation will automatically deny ${conflictIds.length} other pending reservation(s) for the same room and time slot.`
          : "No conflicts detected.";

      return jsonResponse({
        conflicts: conflictIds.length,
        conflict_ids: conflictIds,
        message,
      });
    }

    // Phase 2: confirm = true — perform the approval
    // Re-check room availability
    const { data: roomConflictsConfirm, error: roomConflictConfirmError } = await supabase
      .from("reservations")
      .select("id, start_time, end_time")
      .eq("room_id", reservation.room_id)
      .eq("status", "confirmed")
      .neq("id", reservation_id)
      .lt("start_time", reservation.end_time)
      .gt("end_time", reservation.start_time);

    if (roomConflictConfirmError) {
      return jsonResponse({ error: "Failed to re-check room availability" }, 500);
    }

    if (roomConflictsConfirm && roomConflictsConfirm.length > 0) {
      return jsonResponse({ error: "Room is already booked for this time slot" }, 409);
    }

    // Re-check item availability with overlap
    if (reservationItems && reservationItems.length > 0) {
      for (const ri of reservationItems) {
        const { data: item, error: itemError } = await supabase
          .from("items")
          .select("id, name, quantity")
          .eq("id", ri.item_id)
          .single<ItemRow>();

        if (itemError || !item) continue;

        const { data: confirmedItems } = await supabase
          .from("reservation_items")
          .select("quantity, reservations!inner(start_time, end_time, status)")
          .eq("item_id", ri.item_id)
          .eq("reservations.status", "confirmed")
          .neq("reservation_id", reservation_id)
          .lt("reservations.start_time", reservation.end_time)
          .gt("reservations.end_time", reservation.start_time);

        const committedUnits = confirmedItems?.reduce((sum, ci) => sum + ci.quantity, 0) ?? 0;
        const available = item.quantity - committedUnits;

        if (ri.quantity > available) {
          return jsonResponse(
            {
              error: `Item '${item.name}' is no longer available for this time slot`,
              unavailable_items: [{ item_id: ri.item_id, name: item.name, requested: ri.quantity, available }],
            },
            409
          );
        }
      }
    }

    // Update this reservation to confirmed
    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        status: "confirmed",
        owner_message: owner_message ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation_id);

    if (updateError) {
      return jsonResponse({ error: "Failed to confirm reservation" }, 500);
    }

    // Find and auto-deny overlapping pending reservations
    const { data: overlappingPendingDeny } = await supabase
      .from("reservations")
      .select("id, user_id")
      .eq("room_id", reservation.room_id)
      .eq("status", "pending")
      .neq("id", reservation_id)
      .lt("start_time", reservation.end_time)
      .gt("end_time", reservation.start_time);

    const autoDeniedIds = overlappingPendingDeny?.map((r) => r.id) ?? [];
    const autoDeniedUsers = overlappingPendingDeny?.map((r) => r.user_id) ?? [];
    const roomName = room?.name ?? "la sala";

    if (autoDeniedIds.length > 0) {
      await supabase
        .from("reservations")
        .update({
          status: "denied",
          owner_message: "Otra reserva fue confirmada para este horario.",
          updated_at: new Date().toISOString(),
        })
        .in("id", autoDeniedIds);

      const formatDate = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
      };

      const dateStr = formatDate(reservation.start_time);
      const autoDenyNotifications = autoDeniedUsers.map((uid) => ({
        user_id: uid,
        type: "reservation_denied" as const,
        message: `Tu reserva en ${roomName} para ${dateStr} ha sido denegada porque otra reserva fue confirmada para el mismo horario.`,
        owner_message: "Otra reserva fue confirmada para este horario.",
      }));

      await supabase.from("notifications").insert(autoDenyNotifications);
    }

    // Create notification for the approved user
    const formatDateApproved = (iso: string) => {
      const d = new Date(iso);
      return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
    };

    const dateStrApproved = formatDateApproved(reservation.start_time);
    await supabase.from("notifications").insert({
      user_id: reservation.user_id,
      type: "reservation_confirmed",
      message: `Tu reserva en ${roomName} para ${dateStrApproved} ha sido confirmada.`,
      owner_message: owner_message ?? null,
    });

    return jsonResponse({
      success: true,
      auto_denied_count: autoDeniedIds.length,
      auto_denied_ids: autoDeniedIds,
    });
  } catch (err) {
    console.error("approve-reservation error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
