/**
 * Email template builders for SoniCo notifications.
 * All templates return { subject: string, html: string }.
 * Spanish language, es-AR locale, America/Bogota timezone.
 */

const TZ = "America/Bogota";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function baseHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SoniCo</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background:#1a1a2e;padding:24px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;">🎸 SoniCo</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background:#f4f4f5;padding:16px 24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#666666;">
                SoniCo — Tu estudio de ensayo musical
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#333333;">${text}</p>`;
}

function detailRow(label: string, value: string): string {
  return `<p style="margin:0 0 8px;font-size:14px;color:#666666;"><strong style="color:#333333;">${label}:</strong> ${value}</p>`;
}

function ctaButton(text: string, href: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td align="center">
        <a href="${href}" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;border-radius:6px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function messageBox(message: string): string {
  if (!message) return "";
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff3cd;border-radius:6px;margin:16px 0;">
    <tr>
      <td style="padding:16px;">
        <p style="margin:0;font-size:14px;color:#856404;"><strong>Mensaje del estudio:</strong><br>${message}</p>
      </td>
    </tr>
  </table>`;
}

// ─── Reservation Templates ──────────────────────────────────────────────────

export function buildReservationRequestedEmail(
  reservation: { id: string; start_time: string; band_name?: string },
  room: { id: string; name: string },
  user: { full_name: string }
): { subject: string; html: string } {
  const subject = `Nueva solicitud de reserva - ${room.name}`;
  const body = `
    ${paragraph(`<strong>${user.full_name}</strong> ha solicitado una reserva.`)}
    ${detailRow("Sala", room.name)}
    ${detailRow("Fecha", formatDate(reservation.start_time))}
    ${detailRow("Hora", formatDatetime(reservation.start_time))}
    ${reservation.band_name ? detailRow("Banda", reservation.band_name) : ""}
    ${detailRow("ID de reserva", reservation.id)}
    ${ctaButton("Ver solicitudes pendientes", "https://sonico.com/owner/pending")}
  `;
  return { subject, html: baseHtml(body) };
}

export function buildReservationConfirmedEmail(
  reservation: { id: string; start_time: string; end_time: string },
  room: { name: string },
  ownerMessage?: string
): { subject: string; html: string } {
  const subject = `Tu reserva en ${room.name} fue confirmada`;
  const body = `
    ${paragraph(`¡Buenas noticias! Tu reserva en <strong>${room.name}</strong> ha sido confirmada.`)}
    ${detailRow("Fecha", formatDate(reservation.start_time))}
    ${detailRow("Horario", `${formatDatetime(reservation.start_time)} - ${formatDatetime(reservation.end_time)}`)}
    ${detailRow("ID de reserva", reservation.id)}
    ${messageBox(ownerMessage ?? "")}
    ${paragraph("Te esperamos. ¡Practica, graba y haz sonar tu música!")}
  `;
  return { subject, html: baseHtml(body) };
}

export function buildReservationDeniedEmail(
  reservation: { id: string; start_time: string },
  room: { name: string },
  ownerMessage?: string
): { subject: string; html: string } {
  const subject = `Tu solicitud de reserva fue denegada`;
  const body = `
    ${paragraph(`Tu solicitud de reserva en <strong>${room.name}</strong> no pudo ser aprobada.`)}
    ${detailRow("Sala", room.name)}
    ${detailRow("Fecha", formatDate(reservation.start_time))}
    ${detailRow("ID de solicitud", reservation.id)}
    ${messageBox(ownerMessage ?? "")}
    ${paragraph("Puedes intentar con otro horario o comunicarte con el estudio.")}
  `;
  return { subject, html: baseHtml(body) };
}

export function buildReservationCancelledEmail(
  reservation: { id: string; start_time: string },
  room: { name: string },
  ownerMessage?: string
): { subject: string; html: string } {
  const subject = `Tu reserva fue cancelada por el estudio`;
  const body = `
    ${paragraph(`Lamentamos informarte que tu reserva en <strong>${room.name}</strong> ha sido cancelada.`)}
    ${detailRow("Sala", room.name)}
    ${detailRow("Fecha", formatDate(reservation.start_time))}
    ${detailRow("ID de reserva", reservation.id)}
    ${messageBox(ownerMessage ?? "")}
    ${paragraph("Disculpa las molestias. Puedes comunicarte con el estudio para más información.")}
  `;
  return { subject, html: baseHtml(body) };
}

// ─── Rental Templates ───────────────────────────────────────────────────────

export function buildRentalRequestedEmail(
  rental: { id: string; start_datetime: string; end_datetime: string; band_or_event_name?: string; details?: string },
  items: { name: string; quantity: number }[],
  user: { full_name: string }
): { subject: string; html: string } {
  const subject = `Nueva solicitud de alquiler - ${rental.band_or_event_name ?? "Alquiler"}`;
  const itemsList = items.map((i) => `${i.name} x${i.quantity}`).join("<br>");
  const body = `
    ${paragraph(`<strong>${user.full_name}</strong> ha solicitado un alquiler de equipos.`)}
    ${detailRow("Evento/Banda", rental.band_or_event_name ?? "—")}
    ${detailRow("Equipo", itemsList)}
    ${detailRow("Desde", formatDatetime(rental.start_datetime))}
    ${detailRow("Hasta", formatDatetime(rental.end_datetime))}
    ${rental.details ? detailRow("Detalles", rental.details) : ""}
    ${detailRow("ID de solicitud", rental.id)}
    ${ctaButton("Ver solicitudes pendientes", "https://sonico.com/owner/pending")}
  `;
  return { subject, html: baseHtml(body) };
}

export function buildRentalConfirmedEmail(
  rental: { id: string; start_datetime: string; end_datetime: string },
  items: { name: string; quantity: number }[],
  ownerMessage?: string
): { subject: string; html: string } {
  const subject = `Tu alquiler fue confirmado`;
  const itemsList = items.map((i) => `${i.name} x${i.quantity}`).join("<br>");
  const body = `
    ${paragraph(`¡Buenas noticias! Tu alquiler de equipos ha sido confirmado.`)}
    ${detailRow("Equipo", itemsList)}
    ${detailRow("Desde", formatDatetime(rental.start_datetime))}
    ${detailRow("Hasta", formatDatetime(rental.end_datetime))}
    ${detailRow("ID de alquiler", rental.id)}
    ${messageBox(ownerMessage ?? "")}
    ${paragraph("Te esperamos. ¡Practica, graba y haz sonar tu música!")}
  `;
  return { subject, html: baseHtml(body) };
}

export function buildRentalDeniedEmail(
  rental: { id: string; start_datetime: string; end_datetime: string },
  items: { name: string; quantity: number }[],
  ownerMessage?: string
): { subject: string; html: string } {
  const subject = `Tu solicitud de alquiler fue denegada`;
  const itemsList = items.map((i) => `${i.name} x${i.quantity}`).join("<br>");
  const body = `
    ${paragraph(`Tu solicitud de alquiler de equipos no pudo ser aprobada.`)}
    ${detailRow("Equipo", itemsList)}
    ${detailRow("Desde", formatDatetime(rental.start_datetime))}
    ${detailRow("Hasta", formatDatetime(rental.end_datetime))}
    ${detailRow("ID de solicitud", rental.id)}
    ${messageBox(ownerMessage ?? "")}
    ${paragraph("Puedes intentar con otro horario o comunicarte con el estudio.")}
  `;
  return { subject, html: baseHtml(body) };
}

export function buildRentalCancelledEmail(
  rental: { id: string; start_datetime: string; end_datetime: string },
  items: { name: string; quantity: number }[],
  ownerMessage?: string
): { subject: string; html: string } {
  const subject = `Tu alquiler fue cancelado por el estudio`;
  const itemsList = items.map((i) => `${i.name} x${i.quantity}`).join("<br>");
  const body = `
    ${paragraph(`Lamentamos informarte que tu alquiler de equipos ha sido cancelado.`)}
    ${detailRow("Equipo", itemsList)}
    ${detailRow("Desde", formatDatetime(rental.start_datetime))}
    ${detailRow("Hasta", formatDatetime(rental.end_datetime))}
    ${detailRow("ID de alquiler", rental.id)}
    ${messageBox(ownerMessage ?? "")}
    ${paragraph("Disculpa las molestias. Puedes comunicarte con el estudio para más información.")}
  `;
  return { subject, html: baseHtml(body) };
}
