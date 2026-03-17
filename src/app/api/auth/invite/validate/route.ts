import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/api/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // Fetch invite from Supabase
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invites")
    .select("email, expires_at, used, role")
    .eq("token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Invalid or expired invite token." }, { status: 404 });
  }
  if (data.used) {
    return NextResponse.json({ error: "Invite token already used." }, { status: 410 });
  }
  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite token expired." }, { status: 410 });
  }
  return NextResponse.json({ email: data.email, role: data.role });
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // Mark invite as used in Supabase
  const supabase = await createClient();
  const { error } = await supabase.from("invites").update({ used: true }).eq("token", token);

  if (error) {
    return NextResponse.json({ error: "Failed to mark invite as used" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
