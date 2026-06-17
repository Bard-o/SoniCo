/**
 * Shared email module for SoniCo.
 * Uses Resend HTTP API via fetch() — no SDK dependency.
 * Fire-and-forget: all sends are wrapped in try/catch, never throw.
 */

import {
  buildReservationRequestedEmail,
  buildReservationConfirmedEmail,
  buildReservationDeniedEmail,
  buildReservationCancelledEmail,
  buildRentalRequestedEmail,
  buildRentalConfirmedEmail,
  buildRentalDeniedEmail,
  buildRentalCancelledEmail,
} from "./email-templates.ts";

type SupabaseClient = ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2.49.4").createClient>;

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Send an email via Resend API.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const fromAddress = Deno.env.get("RESEND_FROM_ADDRESS") ?? "SoniCo <hola@sonico.com>";

  if (!apiKey) {
    console.error("[email] RESEND_API_KEY not configured, skipping email to:", to);
    return;
  }

  if (!to) {
    console.error("[email] No recipient email, skipping.");
    return;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: fromAddress, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] Resend API error ${res.status}:`, body, { to, subject });
    }
  } catch (err) {
    console.error("[email] Failed to send email:", err, { to, subject });
  }
}

/**
 * Fetch the owner's email address from the profiles table.
 */
export async function getOwnerEmail(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("role", "owner")
    .limit(1)
    .single();

  if (error || !data) {
    console.error("[email] Could not find owner email:", error?.message);
    return null;
  }

  return data.email;
}

/**
 * Fetch a user's email address from the profiles table.
 */
export async function getUserEmail(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (error || !data) {
    console.error("[email] Could not find user email for", userId, ":", error?.message);
    return null;
  }

  return data.email;
}

/**
 * Send an email to the owner.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function sendOwnerEmail(
  supabase: SupabaseClient,
  notificationType: string,
  data: {
    reservation?: Record<string, unknown>;
    rental?: Record<string, unknown>;
    room?: Record<string, unknown>;
    items?: Record<string, unknown>[];
    user?: Record<string, unknown>;
    ownerMessage?: string;
  }
): Promise<void> {
  try {
    const ownerEmail = await getOwnerEmail(supabase);
    if (!ownerEmail) {
      console.error("[email] Could not find owner email for notification type:", notificationType);
      return;
    }

    let emailPayload: { subject: string; html: string } | null = null;

    switch (notificationType) {
      case "reservation_requested":
        emailPayload = buildReservationRequestedEmail(
          data.reservation!,
          data.room!,
          data.user as { full_name: string }
        );
        break;

      case "rental_requested":
        emailPayload = buildRentalRequestedEmail(
          data.rental!,
          (data.items ?? []) as { name: string; quantity: number }[],
          data.user as { full_name: string }
        );
        break;

      default:
        console.warn(`[email] sendOwnerEmail: unhandled notification type: ${notificationType}`);
        return;
    }

    if (emailPayload) {
      await sendEmail(ownerEmail, emailPayload.subject, emailPayload.html);
    }
  } catch (err) {
    console.error("[email] sendOwnerEmail error:", err, { notificationType });
  }
}

/**
 * Orchestrator: build the right email template and send it to a USER.
 * Fire-and-forget — all errors are caught and logged.
 */
export async function sendNotificationEmail(
  supabase: SupabaseClient,
  notificationType: string,
  userId: string,
  data: {
    reservation?: Record<string, unknown>;
    rental?: Record<string, unknown>;
    room?: Record<string, unknown>;
    items?: Record<string, unknown>[];
    user?: Record<string, unknown>;
    ownerMessage?: string;
  }
): Promise<void> {
  try {
    const email = await getUserEmail(supabase, userId);
    if (!email) {
      console.error("[email] No email address for user", userId, "type:", notificationType);
      return;
    }

    let emailPayload: { subject: string; html: string } | null = null;

    switch (notificationType) {
      case "reservation_requested":
        emailPayload = buildReservationRequestedEmail(
          data.reservation!,
          data.room!,
          data.user as { full_name: string }
        );
        break;

      case "reservation_confirmed":
        emailPayload = buildReservationConfirmedEmail(
          data.reservation!,
          data.room as { name: string },
          data.ownerMessage
        );
        break;

      case "reservation_denied":
        emailPayload = buildReservationDeniedEmail(
          data.reservation!,
          data.room as { name: string },
          data.ownerMessage
        );
        break;

      case "reservation_cancelled":
        emailPayload = buildReservationCancelledEmail(
          data.reservation!,
          data.room as { name: string },
          data.ownerMessage
        );
        break;

      case "rental_requested":
        emailPayload = buildRentalRequestedEmail(
          data.rental!,
          (data.items ?? []) as { name: string; quantity: number }[],
          data.user as { full_name: string }
        );
        break;

      case "rental_confirmed":
        emailPayload = buildRentalConfirmedEmail(
          data.rental!,
          (data.items ?? []) as { name: string; quantity: number }[],
          data.ownerMessage
        );
        break;

      case "rental_denied":
        emailPayload = buildRentalDeniedEmail(
          data.rental!,
          (data.items ?? []) as { name: string; quantity: number }[],
          data.ownerMessage
        );
        break;

      case "rental_cancelled":
        emailPayload = buildRentalCancelledEmail(
          data.rental!,
          (data.items ?? []) as { name: string; quantity: number }[],
          data.ownerMessage
        );
        break;

      default:
        console.warn(`[email] Unknown notification type: ${notificationType}`);
        return;
    }

    if (emailPayload) {
      await sendEmail(email, emailPayload.subject, emailPayload.html);
    }
  } catch (err) {
    // Never let email failures propagate — fire-and-forget
    console.error("[email]sendNotificationEmail error:", err, { notificationType, userId });
  }
}
