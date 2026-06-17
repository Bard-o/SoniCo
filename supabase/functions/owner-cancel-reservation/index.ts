import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

interface CancelRequest {
  reservation_id: string;
  owner_message?: string;
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

    // Verify owner
    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("id, role").eq("id", user.id).single();
    if (profileError || !profile) return jsonResponse({ error: "Profile not found" }, 404);
    if (profile.role !== "owner") return jsonResponse({ error: "Solo el propietario puede realizar esta acción" }, 403);

    const body: CancelRequest = await req.json();
    const { reservation_id, owner_message } = body;
    if (!reservation_id) return jsonResponse({ error: "reservation_id is required" }, 400);

    // Fetch reservation
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, user_id, status, start_time, room_id, rooms(name)")
      .eq("id", reservation_id)
      .single();

    if (fetchError || !reservation) return jsonResponse({ error: "Reservation not found" }, 404);
    if (reservation.status !== "confirmed" && reservation.status !== "pending") {
      return jsonResponse({ error: `No se puede cancelar una reserva con estado '${reservation.status}'` }, 400);
    }

    const roomName = (reservation as any).rooms?.name ?? "la sala";

    // Cancel reservation
    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        owner_message: owner_message ?? "Cancelada por el estudio.",
      })
      .eq("id", reservation_id);

    if (updateError) return jsonResponse({ error: "Error al cancelar la reserva" }, 500);

    // Create notification for the user
    const dateStr = new Date(reservation.start_time).toLocaleDateString("es-CO", { day: "numeric", month: "long" });
    await supabase.from("notifications").insert({
      user_id: reservation.user_id,
      type: "reservation_cancelled",
      message: `Tu reserva en ${roomName} para ${dateStr} fue cancelada por el estudio.`,
      owner_message: owner_message ?? "Cancelada por el estudio.",
    });

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("owner-cancel-reservation error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
