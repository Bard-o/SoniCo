import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

interface CancelRequest {
  reservation_id: string;
  reason?: string;
}

interface ReservationRow {
  id: string;
  user_id: string;
  status: string;
  start_time: string;
}

interface StudioSettingsRow {
  min_cancellation_hours: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    // Authenticate via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body: CancelRequest = await req.json();
    const { reservation_id, reason } = body;

    if (!reservation_id) {
      return new Response(JSON.stringify({ error: "reservation_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch reservation
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("id, user_id, status, start_time")
      .eq("id", reservation_id)
      .single<ReservationRow>();

    if (fetchError || !reservation) {
      return new Response(JSON.stringify({ error: "Reservation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate ownership
    if (reservation.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not authorized to cancel this reservation" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate status
    if (reservation.status !== "confirmed") {
      return new Response(
        JSON.stringify({ error: `Cannot cancel reservation with status '${reservation.status}'` }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check cancellation window
    const { data: settings, error: settingsError } = await supabase
      .from("studio_settings")
      .select("min_cancellation_hours")
      .single<StudioSettingsRow>();

    if (settingsError) {
      return new Response(JSON.stringify({ error: "Failed to read studio settings" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const minHours = settings?.min_cancellation_hours ?? 24;
    const startTime = new Date(reservation.start_time).getTime();
    const now = Date.now();
    const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);

    if (hoursUntilStart < minHours) {
      return new Response(
        JSON.stringify({
          error: `Cancellation window has passed. Reservations must be cancelled at least ${minHours} hours before start time.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Perform cancellation
    const { error: updateError, data: updated } = await supabase
      .from("reservations")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason ?? null,
      })
      .eq("id", reservation_id)
      .select("id, status, cancelled_at")
      .single();

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to cancel reservation" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, reservation: updated }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("cancel-reservation error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
