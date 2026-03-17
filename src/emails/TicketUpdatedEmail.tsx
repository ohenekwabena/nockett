import * as React from "react";

export interface TicketUpdatedEmailProps {
  title: string;
  oldStatus: string;
  newStatus: string;
  updaterName?: string;
}

export function TicketUpdatedEmail({ title, oldStatus, newStatus, updaterName }: TicketUpdatedEmailProps) {
  return (
    <div>
      <h2>Ticket Status Updated</h2>
      <p>The status of a ticket has changed{updaterName ? ` by ${updaterName}` : ""}.</p>
      <ul>
        <li>
          <strong>Title:</strong> {title}
        </li>
        <li>
          <strong>Old Status:</strong> {oldStatus}
        </li>
        <li>
          <strong>New Status:</strong> {newStatus}
        </li>
      </ul>
    </div>
  );
}
