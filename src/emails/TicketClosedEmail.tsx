import * as React from "react";
import { StatusBannerEmail } from "./StatusBannerLayout";

export interface TicketClosedEmailProps {
  title: string;
  closerName?: string;
  /** Prior status before closing, when known — drives the "from -> to" transition. */
  oldStatus?: string;
  /** Human ticket id, e.g. "NCK-2481". */
  ticketId?: string;
  /** Absolute URL to view the ticket; powers the CTA. */
  ticketUrl?: string;
  /** Requester / opener name, for the activity-log context row. */
  requesterName?: string;
  /** Formatted ticket-open date, e.g. "Jun 7". */
  createdDate?: string;
  /** Formatted change time, e.g. "2:14 PM". */
  eventTime?: string;
}

/**
 * Sent when a ticket is closed. Closing is itself a status change, so it reuses
 * the same "Status Banner" layout as {@link TicketUpdatedEmail} — keeping every
 * status notification visually consistent — with the new status pinned to CLOSED.
 */
export function TicketClosedEmail({
  title,
  closerName,
  oldStatus,
  ticketId,
  ticketUrl,
  requesterName,
  createdDate,
  eventTime,
}: TicketClosedEmailProps) {
  return (
    <StatusBannerEmail
      newStatus="CLOSED"
      oldStatus={oldStatus}
      subject={title}
      actorName={closerName}
      ticketId={ticketId}
      ticketUrl={ticketUrl}
      requesterName={requesterName}
      createdDate={createdDate}
      eventTime={eventTime}
    />
  );
}
