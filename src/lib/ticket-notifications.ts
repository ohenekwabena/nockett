import { createClient } from "@/api/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TicketCreatedEmailProps } from "@/emails/TicketCreatedEmail";
import type { TicketUpdatedEmailProps } from "@/emails/TicketUpdatedEmail";
import type { TicketClosedEmailProps } from "@/emails/TicketClosedEmail";

/**
 * Ticket notification policy.
 *
 * This module is the single owner of "a ticket changed -> who gets told, with
 * which template". It resolves the recipient, picks the template + subject, and
 * reports success/failure explicitly via {@link NotificationResult} instead of
 * letting failures fall on the floor.
 *
 * Layering: this policy module sits above the `/api/email/ticket` route, which
 * is the transport boundary that keeps `RESEND_API_KEY` server-side; the
 * `email-service` (`src/lib/email-service.ts`) is the low-level adapter beneath
 * that route. Callers (`ticketService.createTicket`/`updateTicket`) talk only to
 * this module, never to the route or the email transport directly.
 */

const FALLBACK_RECIPIENT = "admin@yourdomain.com";

export type NotificationResult = { ok: true; messageId?: string } | { ok: false; error: string };

/** The minimal ticket shape the notification policy needs. */
export interface NotifiableTicket {
  title: string;
  description?: string;
  status: string;
  creator_id?: string;
  assignee_id?: number;
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

async function resolveActorName(supabase: SupabaseClient, assigneeId?: number): Promise<string | undefined> {
  if (!assigneeId) return undefined;
  const { data } = await supabase.from("assignees").select("name").eq("id", assigneeId).single();
  return data?.name ?? undefined;
}

/** POST the rendered-template request to the server transport and surface the outcome. */
async function sendTicketEmail(to: string, subject: string, payload: TicketEmailPayload): Promise<NotificationResult> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  try {
    const res = await fetch(`${baseUrl}/api/email/ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, type: payload.type, props: payload.props }),
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
    },
  });
}

/**
 * Notify the ticket's creator that its status changed. Picks the "closed"
 * template when the new status is CLOSED, otherwise the generic "updated" one.
 * `previousStatus` is optional because not every caller knows the prior value.
 */
export async function notifyTicketStatusChanged(
  ticket: NotifiableTicket,
  previousStatus?: string,
): Promise<NotificationResult> {
  const supabase = createClient();
  const creator = await resolveCreator(supabase, ticket.creator_id);
  const actorName = await resolveActorName(supabase, ticket.assignee_id);

  if (ticket.status === "CLOSED") {
    return sendTicketEmail(creator.email, `Ticket Closed: ${ticket.title}`, {
      type: "ticket-closed",
      props: { title: ticket.title, closerName: actorName },
    });
  }

  return sendTicketEmail(creator.email, `Ticket Status Updated: ${ticket.title}`, {
    type: "ticket-updated",
    props: {
      title: ticket.title,
      oldStatus: previousStatus ?? "",
      newStatus: ticket.status,
      updaterName: actorName,
    },
  });
}
