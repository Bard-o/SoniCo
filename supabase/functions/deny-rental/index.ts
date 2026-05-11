import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

interface DenyRentalRequest {
  rental_id: string;
  owner_message?: string;
}

interface RentalRow {
  id: string;
  user_id: string;
  band_or_event_name: string | null;
  start_datetime: string;
  status: string;
}

interface ProfileRow {
  id: string;
  role: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      });
    }

    if (profile.role !== "owner") {
      return new Response(JSON.stringify({ error: "Only owners can deny rentals" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: DenyRentalRequest = await req.json();
    const { rental_id, owner_message } = body;

    if (!rental_id) {
      return new Response(JSON.stringify({ error: "rental_id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch rental
    const { data: rental, error: fetchError } = await supabase
      .from("rentals")
      .select("id, user_id, band_or_event_name, start_datetime, status")
      .eq("id", rental_id)
      .single<RentalRow>();

    if (fetchError || !rental) {
      return new Response(JSON.stringify({ error: "Rental not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify still pending
    if (rental.status !== "pending") {
      return new Response(
        JSON.stringify({ error: `Rental is no longer pending (current status: ${rental.status})` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update rental status to denied
    const { error: updateError } = await supabase
      .from("rentals")
      .update({
        status: "denied",
        owner_message: owner_message ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rental_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Failed to deny rental" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create notification
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

    await supabase.from("notifications").insert({
      user_id: rental.user_id,
      type: "rental_denied",
      message: `Tu alquiler (${rentalName}) para ${dateTimeStr} ha sido denegado.`,
      owner_message: owner_message ?? null,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("deny-rental error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});