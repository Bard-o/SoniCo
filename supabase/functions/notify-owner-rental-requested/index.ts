import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { sendOwnerEmail } from "../_shared/email.ts";

interface NotifyRequest {
  rental_id: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization",
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
    if (!authHeader) return jsonResponse({ error: "Missing Authorization header" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return jsonResponse({ error: "Invalid or expired token" }, 401);

    // Verify caller is NOT owner — this function is called by users
    const { data: profile } = await supabase
      .from("profiles").select("id, role, full_name").eq("id", user.id).single();

    if (profile?.role === "owner") {
      return jsonResponse({ error: "Owners cannot notify themselves of requests" }, 403);
    }

    const body: NotifyRequest = await req.json();
    const { rental_id } = body;
    if (!rental_id) return jsonResponse({ error: "rental_id is required" }, 400);

    // Fetch rental with items
    const { data: rental, error: fetchError } = await supabase
      .from("rentals")
      .select("*, rental_request_items(item_id, items(name, quantity))")
      .eq("id", rental_id)
      .single();

    if (fetchError || !rental) {
      return jsonResponse({ error: "Rental not found" }, 404);
    }

    // Verify the rental belongs to the caller
    if (rental.user_id !== user.id) {
      return jsonResponse({ error: "Rental does not belong to this user" }, 403);
    }

    // Normalize items list
    const items = (rental as any).rental_request_items?.map((ri: any) => ({
      name: ri.items?.name ?? "Equipo",
      quantity: ri.quantity,
    })) ?? [];

    // Send email to owner (fire-and-forget)
    await sendOwnerEmail(supabase, "rental_requested", {
      rental: {
        id: rental.id,
        start_datetime: rental.start_datetime,
        end_datetime: rental.end_datetime,
        band_or_event_name: rental.band_or_event_name,
        details: rental.details,
      },
      items,
      user: { full_name: profile?.full_name ?? user.email ?? "Usuario" },
    });

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("notify-owner-rental-requested error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
