import * as React from "react";
import { StatusBannerEmail } from "./StatusBannerLayout";

export interface TicketUpdatedEmailProps {
  title: string;
  oldStatus: string;
  newStatus: string;
  updaterName?: string;
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
  /** Current priority, for the meta strip (optional). */
  priority?: string;
  /** Current assignee name, for the meta strip (optional). */
  assignee?: string;
}

/**
 * Sent when a ticket's status changes (any non-terminal status). Renders the
 * shared "Status Banner" layout, keyed to the new status, with the old -> new
 * transition surfaced in the activity log.
 */
export function TicketUpdatedEmail({
  title,
  oldStatus,
  newStatus,
  updaterName,
  ticketId,
  ticketUrl,
  requesterName,
  createdDate,
  eventTime,
  priority,
  assignee,
}: TicketUpdatedEmailProps) {
  return (
    <StatusBannerEmail
      newStatus={newStatus}
      oldStatus={oldStatus}
      subject={title}
      actorName={updaterName}
      ticketId={ticketId}
      ticketUrl={ticketUrl}
      requesterName={requesterName}
      createdDate={createdDate}
      eventTime={eventTime}
      priority={priority}
      assignee={assignee}
    />
  );
}
