import * as React from "react";

export interface TicketClosedEmailProps {
  title: string;
  closerName?: string;
}

export function TicketClosedEmail({ title, closerName }: TicketClosedEmailProps) {
  return (
    <div>
      <h2>Ticket Closed</h2>
      <p>The following ticket has been closed{closerName ? ` by ${closerName}` : ""}.</p>
      <ul>
        <li>
          <strong>Title:</strong> {title}
        </li>
      </ul>
    </div>
  );
}
