import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { sendNotificationEmail } from "../_shared/email.ts";

interface CancelRequest {
  reservation_id: string;
  reason?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const body: CancelRequest = await req.json();
    const { reservation_id } = body;
    if (!reservation_id) return jsonResponse({ error: "reservation_id is required" }, 400);

    // Fetch reservation with room name
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, user_id, status, start_time, room_id, rooms(name)")
      .eq("id", reservation_id)
      .single();

    if (fetchError || !reservation) return jsonResponse({ error: "Reservation not found" }, 404);
    if (reservation.user_id !== user.id) return jsonResponse({ error: "No tienes permiso para cancelar esta reserva" }, 403);
    if (reservation.status !== "confirmed") return jsonResponse({ error: `No puedes cancelar una reserva con estado '${reservation.status}'` }, 400);

    // Check cancellation window
    const { data: settings } = await supabase
      .from("studio_settings")
      .select("min_cancellation_hours")
      .single();

    const minHours = settings?.min_cancellation_hours ?? 24;
    const hoursUntilStart = (new Date(reservation.start_time).getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilStart < minHours) {
      return jsonResponse({
        error: `No puedes cancelar con menos de ${minHours} horas de anticipación.`,
        hours_until_start: Math.max(0, hoursUntilStart).toFixed(1),
        min_hours_required: minHours,
      }, 400);
    }

    const roomName = (reservation as any).rooms?.name ?? "la sala";

    // Cancel reservation
    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", reservation_id);

    if (updateError) return jsonResponse({ error: "Error al cancelar la reserva" }, 500);

    // Create notification
    const dateStr = new Date(reservation.start_time).toLocaleDateString("es-CO", { day: "numeric", month: "long" });
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "reservation_cancelled",
      message: `Reserva cancelada para ${dateStr}.`,
    });

    // Email: confirmation to user
    await sendNotificationEmail(supabase, "reservation_cancelled", user.id, {
      reservation: { id: reservation.id, start_time: (reservation as any).start_time },
      room: { name: roomName },
    });

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("cancel-reservation error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
