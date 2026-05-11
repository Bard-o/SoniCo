import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

interface DenyRequest {
  reservation_id: string;
  owner_message?: string;
}

interface ReservationRow {
  id: string;
  user_id: string;
  room_id: string;
  status: string;
  start_time: string;
  band_name: string | null;
}

interface RoomRow {
  id: string;
  name: string;
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
      return new Response(JSON.stringify({ error: "Only owners can deny reservations" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: DenyRequest = await req.json();
    const { reservation_id, owner_message } = body;

    if (!reservation_id) {
      return new Response(JSON.stringify({ error: "reservation_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch reservation
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, user_id, room_id, status, start_time, band_name")
      .eq("id", reservation_id)
      .single<ReservationRow>();

    if (fetchError || !reservation) {
      return new Response(JSON.stringify({ error: "Reservation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify still pending
    if (reservation.status !== "pending") {
      return new Response(
        JSON.stringify({ error: `Reservation is no longer pending (current status: ${reservation.status})` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch room name
    const { data: room } = await supabase
      .from("rooms")
      .select("id, name")
      .eq("id", reservation.room_id)
      .single<RoomRow>();

    // Update reservation status to denied
    const { error: updateError } = await supabase
      .from("reservations")
      .update({
        status: "denied",
        owner_message: owner_message ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to deny reservation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create notification
    const roomName = room?.name ?? "la sala";
    const formatDate = (iso: string) => {
      const d = new Date(iso);
      return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
    };
    const dateStr = formatDate(reservation.start_time);

    await supabase.from("notifications").insert({
      user_id: reservation.user_id,
      type: "reservation_denied",
      message: `Tu reserva en ${roomName} para ${dateStr} ha sido denegada.`,
      owner_message: owner_message ?? null,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("deny-reservation error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});