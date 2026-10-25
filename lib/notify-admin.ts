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
  paymentStatus?: string | null;
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

export interface AdminPaymentCompletedNotification {
  orderId: string;
  total: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  customerName?: string | null;
  adminOrderUrl?: string;
}

export function notifyAdminPaymentCompleted(
  data: AdminPaymentCompletedNotification,
): Promise<void> {
  const isAdvancePayment = data.paymentStatus === "advance_paid";
  const shortId = data.orderId.slice(0, 8).toUpperCase();
  const statusLabel = isAdvancePayment
    ? "Advance payment completed"
    : "Payment completed";
  const body = [
    `Order #${shortId} payment has been confirmed.`,
    `Status: ${statusLabel}`,
    `Order total: ₹${data.total.toLocaleString("en-IN")}`,
    data.paymentMethod ? `Payment method: ${data.paymentMethod}` : "",
    data.customerName ? `Customer: ${data.customerName}` : "",
    data.adminOrderUrl ? `View order: ${data.adminOrderUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return getAdminRecipients().then((to) =>
    invokeSendEmail({
      template: "generic",
      subject: `${statusLabel} — Order #${shortId}`,
      body,
      to,
    }),
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
