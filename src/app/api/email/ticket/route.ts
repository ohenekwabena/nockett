import { NextRequest, NextResponse } from "next/server";
import { sendEmail, EmailTemplateType } from "@/lib/email-service";

// POST /api/email/ticket
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, type, props } = body;

    // Validate required fields
    if (!to || !subject || !type || !props) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Build the template type
    const template: EmailTemplateType = { type, props } as EmailTemplateType;

    const result = await sendEmail({
      to,
      subject,
      template,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error.message || "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
