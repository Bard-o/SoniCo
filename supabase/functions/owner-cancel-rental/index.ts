import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { sendNotificationEmail } from "../_shared/email.ts";

interface CancelRequest {
  rental_id: string;
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
    const { rental_id, owner_message } = body;
    if (!rental_id) return jsonResponse({ error: "rental_id is required" }, 400);

    // Fetch rental
    const { data: rental, error: fetchError } = await supabase
      .from("rentals")
      .select("id, user_id, status, start_datetime")
      .eq("id", rental_id)
      .single();

    if (fetchError || !rental) return jsonResponse({ error: "Rental not found" }, 404);
    if (rental.status !== "confirmed" && rental.status !== "pending") {
      return jsonResponse({ error: `No se puede cancelar un alquiler con estado '${rental.status}'` }, 400);
    }

    // Fetch rental items for email
    const { data: rentalItems } = await supabase
      .from("rental_request_items")
      .select("quantity, items(name)")
      .eq("rental_id", rental_id);

    // Cancel rental
    const { error: updateError } = await supabase
      .from("rentals")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        owner_message: owner_message ?? "Cancelada por el estudio.",
      })
      .eq("id", rental_id);

    if (updateError) return jsonResponse({ error: "Error al cancelar el alquiler" }, 500);

    // Create notification for the user
    const dateStr = new Date(rental.start_datetime).toLocaleDateString("es-CO", { day: "numeric", month: "long" });
    await supabase.from("notifications").insert({
      user_id: rental.user_id,
      type: "rental_cancelled",
      message: `Tu alquiler para el ${dateStr} fue cancelado por el estudio.`,
      owner_message: owner_message ?? "Cancelada por el estudio.",
    });

    // Email: cancelled user
    const items = rentalItems?.map((ri: any) => ({
      name: ri.items?.name ?? "Equipo",
      quantity: ri.quantity,
    })) ?? [];
    await sendNotificationEmail(supabase, "rental_cancelled", rental.user_id, {
      rental: { id: rental.id, start_datetime: rental.start_datetime, end_datetime: rental.end_datetime },
      items,
      ownerMessage: owner_message ?? "Cancelada por el estudio.",
    });

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("owner-cancel-rental error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
