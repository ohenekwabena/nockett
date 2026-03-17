import * as React from "react";

export interface UserInviteEmailProps {
  inviteLink: string;
  adminName?: string;
}

export function UserInviteEmail({ inviteLink, adminName }: UserInviteEmailProps) {
  return (
    <div>
      <h2>You're invited to join Nockett!</h2>
      <p>{adminName ? `${adminName} has invited you to join Nockett.` : "You've been invited to join Nockett."}</p>
      <p>Click the link below to create your account:</p>
      <a href={inviteLink} style={{ color: "#2563eb", fontWeight: "bold" }}>
        {inviteLink}
      </a>
      <p>If you did not expect this invitation, you can safely ignore this email.</p>
    </div>
  );
}
