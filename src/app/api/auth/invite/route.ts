import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email-service";
import { UserInviteEmail } from "@/emails/UserInviteEmail";
import crypto from "crypto";
import { createClient } from "@/api/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, adminName } = body;
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Generate invite token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

  // Store invite in Supabase
  const supabase = await createClient();
  const { error: dbError } = await supabase.from("invites").insert([
    {
      email,
      token,
      expires_at: expiresAt.toISOString(),
      used: false,
    },
  ]);
  if (dbError) {
    return NextResponse.json({ error: "Failed to store invite" }, { status: 500 });
  }

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

  return NextResponse.json({ success: true, token });
}
