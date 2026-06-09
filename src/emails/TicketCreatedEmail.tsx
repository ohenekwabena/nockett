import * as React from "react";
import { StatusBannerEmail } from "./StatusBannerLayout";

export interface TicketCreatedEmailProps {
  title: string;
  description?: string;
  status: string;
  creatorName?: string;
  /** Human ticket id, e.g. "NCK-2481". */
  ticketId?: string;
  /** Absolute URL to view the ticket; powers the CTA. */
  ticketUrl?: string;
  /** Formatted ticket-open date, e.g. "Jun 7". */
  createdDate?: string;
  /** Formatted creation time, e.g. "2:14 PM". */
  eventTime?: string;
}

/**
 * Sent to the creator when their ticket is opened. Reuses the shared "Status
 * Banner" layout in its "created" mode — a "New ticket" banner keyed to the
 * initial status, with the description surfaced in the activity log — so the
 * whole notification family looks consistent.
 */
export function TicketCreatedEmail({
  title,
  description,
  status,
  creatorName,
  ticketId,
  ticketUrl,
  createdDate,
  eventTime,
}: TicketCreatedEmailProps) {
  return (
    <StatusBannerEmail
      intent="created"
      newStatus={status}
      subject={title}
      bodyText={description}
      actorName={creatorName}
      ticketId={ticketId}
      ticketUrl={ticketUrl}
      createdDate={createdDate}
      eventTime={eventTime}
    />
  );
}
