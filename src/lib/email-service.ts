
import { Resend } from "resend";
import { render } from "@react-email/render";
import { TicketCreatedEmail, TicketCreatedEmailProps } from "../emails/TicketCreatedEmail";
import { TicketUpdatedEmail, TicketUpdatedEmailProps } from "../emails/TicketUpdatedEmail";
import { TicketClosedEmail, TicketClosedEmailProps } from "../emails/TicketClosedEmail";

// Email configuration
const FROM_EMAIL = process.env.EMAIL_FROM || "Nockett <tickets@notifications.nockett.com>";
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || "support@nockett.com";

// Singleton Resend client
let resend: Resend | undefined;
function getResendClient() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set - configure this in your environment variables");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Centralized config validation
export function validateEmailConfig() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  return true;
}

// Email template type
import { UserInviteEmail, UserInviteEmailProps } from "../emails/UserInviteEmail";

export type EmailTemplateType =
  | { type: "ticket-created"; props: TicketCreatedEmailProps }
  | { type: "ticket-updated"; props: TicketUpdatedEmailProps }
  | { type: "ticket-closed"; props: TicketClosedEmailProps }
  | { type: "user-invite"; props: UserInviteEmailProps };

async function renderEmailTemplate(template: EmailTemplateType): Promise<string> {
  switch (template.type) {
    case "ticket-created":
      return await render(TicketCreatedEmail(template.props));
    case "ticket-updated":
      return await render(TicketUpdatedEmail(template.props));
    case "ticket-closed":
      return await render(TicketClosedEmail(template.props));
    case "user-invite":
      return await render(UserInviteEmail(template.props));
    default:
      throw new Error("Unknown email template type");
  }
}

/**
 * Send a generic email (optionally using a template)
 */
export async function sendEmail({
  to,
  subject,
  html,
  template,
}: {
  to: string;
  subject: string;
  html?: string;
  template?: EmailTemplateType;
}) {
  try {
    validateEmailConfig();
    let emailHtml: string | undefined = html;
    if (template) {
      emailHtml = await renderEmailTemplate(template);
    }
    if (!emailHtml) throw new Error("No email HTML provided");
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: REPLY_TO_EMAIL,
      subject,
      html: emailHtml,
    });
    if (error) {
      console.error("Failed to send email:", error);
      throw new Error("Failed to send email");
    }
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Resend email error:", error);
    return { error };
  }
}

/**
 * Test email configuration (useful for development)
 */
export async function testEmailConfig() {
  try {
    validateEmailConfig();
    const { data, error } = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: ["delivered@resend.dev"],
      subject: "Nockett Email Configuration Test",
      html: "<p>This is a test email to verify Resend configuration.</p>",
    });
    if (error) {
      throw error;
    }
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error("Email configuration test failed:", error);
    throw error;
  }
}
