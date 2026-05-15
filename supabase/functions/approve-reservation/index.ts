import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

interface ApproveRequest {
  reservation_id: string;
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
    if (profile.role !== "owner") return jsonResponse({ error: "Only owners can approve reservations" }, 403);

    const body: ApproveRequest = await req.json();
    const { reservation_id, owner_message, confirm } = body;
    if (!reservation_id) return jsonResponse({ error: "reservation_id is required" }, 400);

    // Fetch reservation
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, user_id, room_id, status, start_time, end_time, band_name")
      .eq("id", reservation_id).single();

    if (fetchError || !reservation) return jsonResponse({ error: "Reservation not found" }, 404);
    if (reservation.status !== "pending") {
      return jsonResponse({ error: `Reservation is no longer pending (current status: ${reservation.status})` }, 400);
    }

    // Fetch room
    const { data: room } = await supabase
      .from("rooms").select("id, name").eq("id", reservation.room_id).single();
    if (!room) return jsonResponse({ error: "Room not found" }, 404);
    const roomName = room.name;

    // Fetch reservation items
    const { data: reservationItems } = await supabase
      .from("reservation_items").select("id, item_id, quantity")
      .eq("reservation_id", reservation_id);

    // Phase 1: Check conflicts
    if (!confirm) {
      // 1. Check room availability (confirmed reservations)
      const { data: roomConflicts } = await supabase
        .from("reservations").select("id")
        .eq("room_id", reservation.room_id).eq("status", "confirmed")
        .neq("id", reservation_id)
        .lt("start_time", reservation.end_time).gt("end_time", reservation.start_time);

      if (roomConflicts && roomConflicts.length > 0) {
        return jsonResponse({ error: "Room is already booked for this time slot", conflicts: roomConflicts.length }, 409);
      }

      // 2. Check add-on item availability against confirmed items
      if (reservationItems && reservationItems.length > 0) {
        for (const ri of reservationItems) {
          const { data: item } = await supabase.from("items").select("id, name, quantity").eq("id", ri.item_id).single();
          if (!item) continue;

          const { data: committed } = await supabase
            .from("reservation_items")
            .select("quantity, reservations!inner(start_time, end_time, status)")
            .eq("item_id", ri.item_id).eq("reservations.status", "confirmed")
            .neq("reservation_id", reservation_id)
            .lt("reservations.start_time", reservation.end_time)
            .gt("reservations.end_time", reservation.start_time);

          const used = committed?.reduce((s: number, c: any) => s + c.quantity, 0) ?? 0;
          if (ri.quantity > item.quantity - used) {
            return jsonResponse({
              error: `Item '${item.name}' is no longer available`,
              unavailable_items: [{ item_id: ri.item_id, name: item.name, requested: ri.quantity, available: item.quantity - used }],
            }, 409);
          }
        }
      }

      // 3. Same-type conflicts: overlapping pending reservations (will auto-deny)
      const { data: overlappingPending } = await supabase
        .from("reservations").select("id")
        .eq("room_id", reservation.room_id).eq("status", "pending")
        .neq("id", reservation_id)
        .lt("start_time", reservation.end_time).gt("end_time", reservation.start_time);

      const conflictIds = overlappingPending?.map((r: any) => r.id) ?? [];

      // 4. Cross-type conflicts: check if pending rentals need the same items
      let crossConflictIds: string[] = [];
      if (reservationItems && reservationItems.length > 0) {
        const itemIds = reservationItems.map((ri: any) => ri.item_id);

        const { data: conflictingRentals } = await supabase
          .from("rentals")
          .select("id, rental_request_items!inner(item_id)")
          .eq("status", "pending")
          .lt("start_datetime", reservation.end_time)
          .gt("end_datetime", reservation.start_time);

        if (conflictingRentals) {
          crossConflictIds = conflictingRentals
            .filter((r: any) => {
              const items = r.rental_request_items ?? [];
              return items.some((ri: any) => itemIds.includes(ri.item_id));
            })
            .map((r: any) => r.id);
        }
      }

      const crossMsg = crossConflictIds.length > 0
        ? `Also, ${crossConflictIds.length} pending equipment rental(s) use the same items during this time.`
        : "";

      const msgParts: string[] = [];
      if (conflictIds.length > 0) {
        msgParts.push(`Approving will auto-deny ${conflictIds.length} other pending reservation(s) for this room.`);
      }
      if (crossMsg) msgParts.push(crossMsg);
      if (msgParts.length === 0) msgParts.push("No conflicts detected.");

      return jsonResponse({
        conflicts: conflictIds.length,
        conflict_ids: conflictIds,
        cross_conflicts: crossConflictIds.length,
        cross_conflict_ids: crossConflictIds,
        cross_conflict_type: "rental",
        message: msgParts.join(" "),
      });
    }

    // Phase 2: confirm = true
    // Re-check room availability
    const { data: roomConflicts2 } = await supabase
      .from("reservations").select("id")
      .eq("room_id", reservation.room_id).eq("status", "confirmed")
      .neq("id", reservation_id)
      .lt("start_time", reservation.end_time).gt("end_time", reservation.start_time);

    if (roomConflicts2 && roomConflicts2.length > 0) {
      return jsonResponse({ error: "Room is already booked for this time slot" }, 409);
    }

    // Re-check item availability
    if (reservationItems && reservationItems.length > 0) {
      for (const ri of reservationItems) {
        const { data: item } = await supabase.from("items").select("id, name, quantity").eq("id", ri.item_id).single();
        if (!item) continue;

        const { data: committed } = await supabase
          .from("reservation_items")
          .select("quantity, reservations!inner(start_time, end_time, status)")
          .eq("item_id", ri.item_id).eq("reservations.status", "confirmed")
          .neq("reservation_id", reservation_id)
          .lt("reservations.start_time", reservation.end_time)
          .gt("reservations.end_time", reservation.start_time);

        const used = committed?.reduce((s: number, c: any) => s + c.quantity, 0) ?? 0;
        if (ri.quantity > item.quantity - used) {
          return jsonResponse({
            error: `Item '${item.name}' is no longer available`,
            unavailable_items: [{ item_id: ri.item_id, name: item.name, requested: ri.quantity, available: item.quantity - used }],
          }, 409);
        }
      }
    }

    // Update to confirmed
    const { error: updateError } = await supabase
      .from("reservations")
      .update({ status: "confirmed", owner_message: owner_message ?? null, updated_at: new Date().toISOString() })
      .eq("id", reservation_id);

    if (updateError) return jsonResponse({ error: "Failed to confirm reservation" }, 500);

    // Auto-deny overlapping pending reservations
    const { data: overlappingPendingDeny } = await supabase
      .from("reservations").select("id, user_id")
      .eq("room_id", reservation.room_id).eq("status", "pending")
      .neq("id", reservation_id)
      .lt("start_time", reservation.end_time).gt("end_time", reservation.start_time);

    const autoDeniedIds = overlappingPendingDeny?.map((r: any) => r.id) ?? [];

    if (autoDeniedIds.length > 0) {
      await supabase.from("reservations")
        .update({ status: "denied", owner_message: "Otra reserva fue confirmada para este horario.", updated_at: new Date().toISOString() })
        .in("id", autoDeniedIds);

      const dateStr = new Date(reservation.start_time).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
      const notifications = overlappingPendingDeny?.map((r: any) => ({
        user_id: r.user_id,
        type: "reservation_denied",
        message: `Tu reserva en ${roomName} para ${dateStr} ha sido denegada porque otra reserva fue confirmada para el mismo horario.`,
        owner_message: "Otra reserva fue confirmada para este horario.",
      })) ?? [];
      await supabase.from("notifications").insert(notifications);
    }

    // Notify approved user
    await supabase.from("notifications").insert({
      user_id: reservation.user_id,
      type: "reservation_confirmed",
      message: `Tu reserva en ${roomName} ha sido confirmada.`,
      owner_message: owner_message ?? null,
    });

    return jsonResponse({ success: true, auto_denied_count: autoDeniedIds.length, auto_denied_ids: autoDeniedIds });
  } catch (err) {
    console.error("approve-reservation error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
