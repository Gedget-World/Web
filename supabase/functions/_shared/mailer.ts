import nodemailer from "npm:nodemailer@6";

const EMAIL_USER = Deno.env.get("email_user")!;
const EMAIL_APP_PASSWORD = Deno.env.get("email_app_password")!;

const DEFAULT_FROM =
  '"Gadget Kabila Monitoring" <gadgetskabilamonitoring@gmail.com>';

// Single visible "to" address used whenever recipients are sent via BCC —
// keeps the actual admin recipient list hidden from each other.
export const MONITORING_EMAIL = "gadgetskabilamonitoring@gmail.com";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_APP_PASSWORD,
  },
});

export interface MailOptions {
  to: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export function sendMail(options: MailOptions) {
  return transporter.sendMail({
    from: options.from ?? DEFAULT_FROM,
    to: options.to,
    bcc: options.bcc,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

// Comma-separated fallback recipients configured via the ADMIN_NOTIFICATION_EMAILS secret.
export function getDefaultAdminRecipients(): string[] {
  const raw = Deno.env.get("ADMIN_NOTIFICATION_EMAILS") ?? "";
  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}
