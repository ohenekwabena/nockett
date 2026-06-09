import { createClient } from "@/api/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TicketCreatedEmailProps } from "@/emails/TicketCreatedEmail";
import type { TicketUpdatedEmailProps } from "@/emails/TicketUpdatedEmail";
import type { TicketClosedEmailProps } from "@/emails/TicketClosedEmail";

/**
 * Ticket notification policy.
 *
 * This module is the single owner of "a ticket changed -> who gets told, with
 * which template". It resolves recipients (the creator for a brand-new ticket;
 * the shared support inbox with every workspace user in BCC for a status change),
 * picks the template + subject, and reports success/failure explicitly via
 * {@link NotificationResult} instead of letting failures fall on the floor.
 *
 * Layering: this policy module sits above the `/api/email/ticket` route, which
 * is the transport boundary that keeps `RESEND_API_KEY` server-side; the
 * `email-service` (`src/lib/email-service.ts`) is the low-level adapter beneath
 * that route. Callers (`ticketService.createTicket`/`updateTicket`) talk only to
 * this module, never to the route or the email transport directly.
 */

const FALLBACK_RECIPIENT = "admin@yourdomain.com";

/** Status-change notifications are addressed here, with every user in BCC. */
const SUPPORT_INBOX = "support@afriwavetelecom.com";

export type NotificationResult = { ok: true; messageId?: string } | { ok: false; error: string };

/** The minimal ticket shape the notification policy needs. */
export interface NotifiableTicket {
  title: string;
  description?: string;
  status: string;
  creator_id?: string;
  /** Row id (uuid) — deep-link fallback when there's no human ticket id. */
  id?: string;
  /** Human ticket id (e.g. "NCK-2481") — shown in the email and used to deep link. */
  ticket_id?: string;
  /** ISO timestamps used to label the email's activity log. */
  created_at?: string;
  updated_at?: string;
}

/**
 * Deep link to a ticket: the in-app /tickets page with a `ticket` query param
 * the page reads to auto-open that ticket's details modal (surviving a login
 * round-trip via the proxy's `redirect` param). Same-origin in the browser —
 * where this module runs — and falls back to NEXT_PUBLIC_BASE_URL server-side.
 */
function ticketDeepLink(ticket: NotifiableTicket): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  const key = ticket.ticket_id ?? ticket.id ?? "";
  const path = key ? `/tickets?ticket=${encodeURIComponent(key)}` : "/tickets";
  return origin ? `${origin}${path}` : path;
}

/** "Jun 7" — short month + day, for the activity-log "opened" row. Undefined if unparseable. */
function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

/** "2:14 PM" — the change time, for the activity-log primary row. Undefined if unparseable. */
function formatTime(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(d);
}

type TicketEmailPayload =
  | { type: "ticket-created"; props: TicketCreatedEmailProps }
  | { type: "ticket-updated"; props: TicketUpdatedEmailProps }
  | { type: "ticket-closed"; props: TicketClosedEmailProps };

async function resolveCreator(
  supabase: SupabaseClient,
  creatorId?: string,
): Promise<{ email: string; name?: string }> {
  if (!creatorId) return { email: FALLBACK_RECIPIENT };
  const { data } = await supabase.from("users").select("email, name").eq("id", creatorId).single();
  return { email: data?.email || FALLBACK_RECIPIENT, name: data?.name ?? undefined };
}

/**
 * Name of the signed-in user performing the change — i.e. whoever clicked save.
 * Used to label "updated/closed by" in the email. Resolved from the active
 * session (`auth.getUser()`) joined to their public.users profile, not from the
 * ticket's assignee. Undefined when there's no session or no profile name.
 */
async function resolveActingUserName(supabase: SupabaseClient): Promise<string | undefined> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return undefined;
  const { data } = await supabase.from("users").select("name").eq("id", userId).single();
  return data?.name ?? undefined;
}

/**
 * Every workspace user's email, for the BCC list. RLS lets any authenticated
 * user read public.users (migration 014), so this runs in the acting user's
 * session. De-duplicated; may be empty (the support inbox is still the TO).
 */
async function resolveAllRecipients(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase.from("users").select("email");
  return Array.from(
    new Set((data ?? []).map((row) => row.email).filter((email): email is string => Boolean(email))),
  );
}

/** POST the rendered-template request to the server transport and surface the outcome. */
async function sendTicketEmail(
  to: string,
  subject: string,
  payload: TicketEmailPayload,
  bcc?: string[],
): Promise<NotificationResult> {
  // This module runs in the browser (ticketService uses the browser Supabase
  // client), so a relative URL keeps the request same-origin and always hits the
  // host the app is actually served from. Prefixing an absolute NEXT_PUBLIC_BASE_URL
  // forced a cross-origin request to the configured host; when that host 307-redirects
  // (e.g. www -> apex) the CORS preflight fails and every notification email is
  // silently dropped. Fall back to the absolute base URL only server-side (no window),
  // where relative URLs don't resolve.
  const baseUrl = typeof window === "undefined" ? process.env.NEXT_PUBLIC_BASE_URL || "" : "";
  try {
    const res = await fetch(`${baseUrl}/api/email/ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, type: payload.type, props: payload.props, bcc }),
    });

    if (!res.ok) {
      let message = `Email request failed with status ${res.status}`;
      try {
        const body = await res.json();
        if (body?.error) message = typeof body.error === "string" ? body.error : JSON.stringify(body.error);
      } catch {
        // No JSON body on the error response; keep the status-based message.
      }
      return { ok: false, error: message };
    }

    const body = await res.json().catch(() => ({}));
    return { ok: true, messageId: body?.messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Notify the ticket's creator that their ticket was created. */
export async function notifyTicketCreated(ticket: NotifiableTicket): Promise<NotificationResult> {
  const supabase = createClient();
  const creator = await resolveCreator(supabase, ticket.creator_id);
  return sendTicketEmail(creator.email, `Ticket Created: ${ticket.title}`, {
    type: "ticket-created",
    props: {
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      creatorName: creator.name,
      ticketId: ticket.ticket_id,
      ticketUrl: ticketDeepLink(ticket),
      createdDate: formatDate(ticket.created_at),
      eventTime: formatTime(ticket.created_at),
    },
  });
}

/**
 * Notify the workspace that a ticket's status changed: a single email to the
 * support inbox with every user in BCC. Picks the "closed" template when the new
 * status is CLOSED, otherwise the generic "updated" one. The change is attributed
 * to whoever performed it (the signed-in user), and `previousStatus` — when the
 * caller knows it — drives the "from -> to" transition in the email.
 */
export async function notifyTicketStatusChanged(
  ticket: NotifiableTicket,
  previousStatus?: string,
): Promise<NotificationResult> {
  const supabase = createClient();
  const [recipients, updaterName, requester] = await Promise.all([
    resolveAllRecipients(supabase),
    resolveActingUserName(supabase),
    resolveCreator(supabase, ticket.creator_id),
  ]);
  // The support inbox is the visible TO; don't also list it in BCC.
  const bcc = recipients.filter((email) => email !== SUPPORT_INBOX);

  // Shared presentation context for the Status Banner email, derived from the
  // ticket already in hand — no extra reads beyond the requester lookup above.
  const banner = {
    ticketId: ticket.ticket_id,
    ticketUrl: ticketDeepLink(ticket),
    requesterName: requester.name,
    createdDate: formatDate(ticket.created_at),
    eventTime: formatTime(ticket.updated_at),
  };

  if (ticket.status === "CLOSED") {
    return sendTicketEmail(
      SUPPORT_INBOX,
      `Ticket Closed: ${ticket.title}`,
      { type: "ticket-closed", props: { title: ticket.title, closerName: updaterName, oldStatus: previousStatus, ...banner } },
      bcc,
    );
  }

  return sendTicketEmail(
    SUPPORT_INBOX,
    `Ticket Status Updated: ${ticket.title}`,
    {
      type: "ticket-updated",
      props: {
        title: ticket.title,
        oldStatus: previousStatus ?? "",
        newStatus: ticket.status,
        updaterName,
        ...banner,
      },
    },
    bcc,
  );
}
