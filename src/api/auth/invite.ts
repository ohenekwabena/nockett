import { NextApiRequest, NextApiResponse } from "next";
import { sendEmail } from "@/lib/email-service";
import { UserInviteEmail } from "@/emails/UserInviteEmail";
import crypto from "crypto";

// In production, store invites in a database. Here, use a simple in-memory store for demo.
const invites: Record<string, { email: string; expiresAt: number }> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { email, adminName } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  // Generate invite token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 24 hours
  invites[token] = { email, expiresAt };

  // Compose invite link
  const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/auth/signup?invite=${token}`;

  // Send email
  await sendEmail({
    to: email,
    subject: "You're invited to join Nockett",
    template: {
      type: "user-invite",
      props: { inviteLink, adminName },
    },
  });

  res.status(200).json({ success: true, token });
}

// Export for use in signup validation
export function validateInviteToken(token: string) {
  const invite = invites[token];
  if (!invite) return null;
  if (invite.expiresAt < Date.now()) return null;
  return invite;
}
