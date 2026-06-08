import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/api/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // Validate via a SECURITY DEFINER RPC (migration 015) so the invites table
  // itself stays unreadable by the anon, pre-signup role (migration 016).
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validate_invite", { p_token: token });
  const invite = Array.isArray(data) ? data[0] : data;

  if (error || !invite) {
    return NextResponse.json({ error: "Invalid or expired invite token." }, { status: 404 });
  }
  if (invite.used) {
    return NextResponse.json({ error: "Invite token already used." }, { status: 410 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite token expired." }, { status: 410 });
  }
  return NextResponse.json({ email: invite.email, role: invite.role });
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // Mark invite as used via SECURITY DEFINER RPC (invites is not writable by the
  // anon, pre-signup role once RLS is enabled in migration 016).
  const supabase = await createClient();
  const { error } = await supabase.rpc("consume_invite", { p_token: token });

  if (error) {
    return NextResponse.json({ error: "Failed to mark invite as used" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
