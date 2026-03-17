import * as React from "react";

export interface TicketCreatedEmailProps {
  title: string;
  description?: string;
  status: string;
  creatorName?: string;
}

export function TicketCreatedEmail({ title, description, status, creatorName }: TicketCreatedEmailProps) {
  return (
    <div>
      <h2>New Ticket Created</h2>
      <p>A new ticket has been created{creatorName ? ` by ${creatorName}` : ""}.</p>
      <ul>
        <li>
          <strong>Title:</strong> {title}
        </li>
        {description && (
          <li>
            <strong>Description:</strong> {description}
          </li>
        )}
        <li>
          <strong>Status:</strong> {status}
        </li>
      </ul>
    </div>
  );
}
