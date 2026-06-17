import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { sendNotificationEmail } from "../_shared/email.ts";

interface CancelRequest {
  rental_id: string;
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
    const { rental_id } = body;
    if (!rental_id) return jsonResponse({ error: "rental_id is required" }, 400);

    // Fetch rental
    const { data: rental, error: fetchError } = await supabase
      .from("rentals")
      .select("id, user_id, status, start_datetime")
      .eq("id", rental_id)
      .single();

    if (fetchError || !rental) return jsonResponse({ error: "Rental not found" }, 404);
    if (rental.user_id !== user.id) return jsonResponse({ error: "No tienes permiso para cancelar este alquiler" }, 403);
    if (rental.status !== "confirmed") return jsonResponse({ error: `No puedes cancelar un alquiler con estado '${rental.status}'` }, 400);

    // Check cancellation window
    const { data: settings } = await supabase
      .from("studio_settings")
      .select("min_cancellation_hours")
      .single();

    const minHours = settings?.min_cancellation_hours ?? 24;
    const hoursUntilStart = (new Date(rental.start_datetime).getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilStart < minHours) {
      return jsonResponse({
        error: `No puedes cancelar con menos de ${minHours} horas de anticipación.`,
        hours_until_start: Math.max(0, hoursUntilStart).toFixed(1),
        min_hours_required: minHours,
      }, 400);
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
      })
      .eq("id", rental_id);

    if (updateError) return jsonResponse({ error: "Error al cancelar el alquiler" }, 500);

    // Create notification
    const dateStr = new Date(rental.start_datetime).toLocaleDateString("es-CO", { day: "numeric", month: "long" });
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "rental_cancelled",
      message: `Alquiler cancelado para el ${dateStr}.`,
    });

    // Email: confirmation to user
    const items = rentalItems?.map((ri: any) => ({
      name: ri.items?.name ?? "Equipo",
      quantity: ri.quantity,
    })) ?? [];
    await sendNotificationEmail(supabase, "rental_cancelled", user.id, {
      rental: { id: rental.id, start_datetime: rental.start_datetime, end_datetime: rental.end_datetime },
      items,
    });

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("cancel-rental error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
