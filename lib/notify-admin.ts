import "server-only";
import { getStoreSetting } from "@/lib/settings";

// Fire-and-forget admin alert emails via the `send-email` Supabase Edge Function.
// Never throws — callers should invoke this without blocking their response
// (e.g. wrapped in Next.js `after()`), failures are only logged.

const SEND_EMAIL_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`;

// Recipients are configured by admins via Settings > Notifications
// (store_settings.admin_notification_emails, a JSON array string).
async function getAdminRecipients(): Promise<string[] | undefined> {
  try {
    const raw = await getStoreSetting("admin_notification_emails", "[]");
    const emails = JSON.parse(raw);
    return Array.isArray(emails) && emails.length > 0 ? emails : undefined;
  } catch {
    return undefined;
  }
}

async function invokeSendEmail(body: unknown): Promise<void> {
  try {
    const res = await fetch(SEND_EMAIL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(
        "[notify-admin] send-email function returned",
        res.status,
        await res.text(),
      );
    }
  } catch (err) {
    console.error("[notify-admin] Failed to invoke send-email function:", err);
  }
}

export interface NewOrderNotification {
  orderId: string;
  total: number;
  paymentMethod?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  shippingCity?: string | null;
  itemCount: number;
  adminOrderUrl?: string;
}

export function notifyAdminNewOrder(data: NewOrderNotification): Promise<void> {
  return getAdminRecipients().then((to) =>
    invokeSendEmail({ template: "new-order", data, to }),
  );
}

export interface NewContactMessageNotification {
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  message: string;
  adminUrl?: string;
}

export function notifyAdminNewContactMessage(
  data: NewContactMessageNotification,
): Promise<void> {
  return getAdminRecipients().then((to) =>
    invokeSendEmail({ template: "contact-message", data, to }),
  );
}
