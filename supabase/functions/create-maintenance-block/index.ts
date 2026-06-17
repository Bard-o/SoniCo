import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { sendNotificationEmail } from "../_shared/email.ts";

interface CreateBlockRequest {
  room_id?: string;
  item_id?: string;
  start_datetime: string;
  end_datetime: string;
  reason: string;
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
    if (profile.role !== "owner") return jsonResponse({ error: "Solo el propietario puede crear bloques de mantenimiento" }, 403);

    const body: CreateBlockRequest = await req.json();
    const { room_id, item_id, start_datetime, end_datetime, reason } = body;

    // Validate: exactly one of room_id or item_id
    if (!room_id && !item_id) {
      return jsonResponse({ error: "Debes especificar una sala o un equipo" }, 400);
    }
    if (room_id && item_id) {
      return jsonResponse({ error: "Especifica solo sala o equipo, no ambos" }, 400);
    }
    if (!reason || reason.trim() === "") {
      return jsonResponse({ error: "El motivo es requerido" }, 400);
    }

    // Validate time range
    const start = new Date(start_datetime);
    const end = new Date(end_datetime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return jsonResponse({ error: "Fechas inválidas" }, 400);
    }
    if (end <= start) {
      return jsonResponse({ error: "La fecha de fin debe ser posterior a la de inicio" }, 400);
    }
    if (start <= new Date()) {
      return jsonResponse({ error: "El bloque debe comenzar en el futuro" }, 400);
    }

    // Check for overlapping blocks on the same resource
    const overlapQuery = room_id
      ? supabase.from("maintenance_blocks").select("id").eq("room_id", room_id)
          .lt("start_datetime", end.toISOString()).gt("end_datetime", start.toISOString())
      : supabase.from("maintenance_blocks").select("id").eq("item_id", item_id)
          .lt("start_datetime", end.toISOString()).gt("end_datetime", start.toISOString());

    const { data: overlapping } = await overlapQuery;
    if (overlapping && overlapping.length > 0) {
      return jsonResponse({ error: "Ya existe un bloque de mantenimiento en ese horario" }, 409);
    }

    // Fetch room name for notifications
    let roomName = "la sala";
    if (room_id) {
      const { data: room } = await supabase.from("rooms").select("name").eq("id", room_id).single();
      roomName = room?.name ?? "la sala";
    }

    // Insert the maintenance block
    const { error: insertError } = await supabase.from("maintenance_blocks").insert({
      room_id: room_id ?? undefined,
      item_id: item_id ?? undefined,
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
      reason: reason.trim(),
    });
    if (insertError) return jsonResponse({ error: "Error al crear el bloque de mantenimiento" }, 500);

    // If room_id: cascade cancel/deny overlapping reservations
    if (room_id) {
      const dateStr = start.toLocaleDateString("es-CO", { day: "numeric", month: "long" });

      // Confirmed reservations overlapping → cancel
      const { data: confirmedRes } = await supabase
        .from("reservations")
        .select("id, user_id, start_time, end_time")
        .eq("room_id", room_id).eq("status", "confirmed")
        .lt("start_time", end.toISOString()).gt("end_time", start.toISOString());

      if (confirmedRes && confirmedRes.length > 0) {
        const confirmedIds = confirmedRes.map((r: any) => r.id);
        await supabase.from("reservations")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            owner_message: "El estudio está en mantenimiento.",
          })
          .in("id", confirmedIds);

        const notifications = confirmedRes.map((r: any) => ({
          user_id: r.user_id,
          type: "reservation_cancelled",
          message: `Tu reserva en ${roomName} para ${dateStr} fue cancelada porque el estudio estará en mantenimiento.`,
          owner_message: "El estudio está en mantenimiento.",
        }));
        await supabase.from("notifications").insert(notifications);

        // Email: cancelled users
        for (const r of confirmedRes) {
          await sendNotificationEmail(supabase, "reservation_cancelled", r.user_id, {
            reservation: { id: r.id, start_time: r.start_time, end_time: r.end_time },
            room: { name: roomName },
            ownerMessage: "El estudio está en mantenimiento.",
          });
        }
      }

      // Pending reservations overlapping → deny
      const { data: pendingRes } = await supabase
        .from("reservations")
        .select("id, user_id, start_time, end_time")
        .eq("room_id", room_id).eq("status", "pending")
        .lt("start_time", end.toISOString()).gt("end_time", start.toISOString());

      if (pendingRes && pendingRes.length > 0) {
        const pendingIds = pendingRes.map((r: any) => r.id);
        await supabase.from("reservations")
          .update({
            status: "denied",
            owner_message: "El estudio está en mantenimiento.",
          })
          .in("id", pendingIds);

        const notifications = pendingRes.map((r: any) => ({
          user_id: r.user_id,
          type: "reservation_denied",
          message: `Tu solicitud de reserva en ${roomName} fue denegada porque el estudio estará en mantenimiento.`,
          owner_message: "El estudio está en mantenimiento.",
        }));
        await supabase.from("notifications").insert(notifications);

        // Email: denied users
        for (const r of pendingRes) {
          await sendNotificationEmail(supabase, "reservation_denied", r.user_id, {
            reservation: { id: r.id, start_time: r.start_time, end_time: r.end_time },
            room: { name: roomName },
            ownerMessage: "El estudio está en mantenimiento.",
          });
        }
      }

      const totalAffected = (confirmedRes?.length ?? 0) + (pendingRes?.length ?? 0);
      return jsonResponse({
        success: true,
        affected_reservations: totalAffected,
        cancelled: confirmedRes?.length ?? 0,
        denied: pendingRes?.length ?? 0,
      });
    }

    // If item_id: just return success, no cascade
    return jsonResponse({ success: true, affected_reservations: 0 });
  } catch (err) {
    console.error("create-maintenance-block error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
