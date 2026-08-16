// Shared responsive HTML email templates for admin alert notifications.
// Table-based layout + inline styles for broad email-client compatibility.

const BRAND = {
  navy: "#1e3a5f",
  amber: "#f59e0b",
  teal: "#14b8a6",
  coral: "#fb7185",
  slate900: "#0f172a",
  slate700: "#334155",
  slate500: "#64748b",
  slate300: "#cbd5e1",
  slate100: "#f1f5f9",
  white: "#ffffff",
};

interface LayoutOptions {
  preheader: string;
  badge: string;
  heading: string;
  bodyHtml: string;
  accentColor?: string;
}

function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function layout({
  preheader,
  badge,
  heading,
  bodyHtml,
  accentColor = BRAND.amber,
}: LayoutOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${heading}</title>
    <style>
      body, table, td, a { font-family: 'Segoe UI', Roboto, -apple-system, Helvetica, Arial, sans-serif; }
      @media only screen and (max-width: 620px) {
        .container { width: 100% !important; border-radius: 0 !important; }
        .px { padding-left: 20px !important; padding-right: 20px !important; }
        .stack { display: block !important; width: 100% !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:${BRAND.slate100};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.slate100};">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:${BRAND.white}; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(15,23,42,0.08);">
            <tr>
              <td style="background-color:${BRAND.navy}; padding:20px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:16px; font-weight:700; color:${BRAND.white};">Gadget Kabila</td>
                    <td align="right">
                      <span style="display:inline-block; font-size:11px; font-weight:700; letter-spacing:0.5px; color:${BRAND.slate900}; background-color:${accentColor}; padding:4px 10px; border-radius:999px; text-transform:uppercase;">${badge}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="px" style="padding:32px;">
                <h1 style="margin:0 0 16px; font-size:22px; line-height:1.3; color:${BRAND.slate900};">${heading}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td class="px" style="padding:20px 32px; background-color:${BRAND.slate100}; border-top:1px solid ${BRAND.slate300};">
                <p style="margin:0; font-size:12px; color:${BRAND.slate500};">This is an automated alert from Gadget Kabila Monitoring. Do not reply to this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0; font-size:13px; color:${BRAND.slate500}; width:40%; vertical-align:top;">${label}</td>
    <td style="padding:8px 0; font-size:14px; color:${BRAND.slate900}; font-weight:600; vertical-align:top;">${value}</td>
  </tr>`;
}

function detailsTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BRAND.slate300}; margin-top:8px;">${rows}</table>`;
}

function button(
  label: string,
  url: string,
  color: string = BRAND.amber,
): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
    <tr>
      <td style="border-radius:6px; background-color:${color};">
        <a href="${url}" style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:600; color:${BRAND.slate900}; text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`;
}

function statCard(label: string, value: string, color: string): string {
  return `<td class="stack" width="50%" style="padding:6px; vertical-align:top;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.slate100}; border-radius:8px;">
      <tr>
        <td style="padding:16px;">
          <div style="font-size:12px; color:${BRAND.slate500}; margin-bottom:4px;">${label}</div>
          <div style="font-size:20px; font-weight:700; color:${color};">${value}</div>
        </td>
      </tr>
    </table>
  </td>`;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

// ---------------------------------------------------------------------------
// New order alert
// ---------------------------------------------------------------------------

export interface NewOrderEmailData {
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

export function renderNewOrderEmail(data: NewOrderEmailData): RenderedEmail {
  const shortId = data.orderId.slice(0, 8).toUpperCase();
  const rows = [
    row("Order ID", `#${escapeHtml(shortId)}`),
    row("Order Total", formatCurrency(data.total)),
    row("Items", String(data.itemCount)),
    row(
      "Payment Method",
      escapeHtml((data.paymentMethod || "N/A").toUpperCase()),
    ),
    row("Customer", escapeHtml(data.customerName || "Guest")),
    data.customerEmail ? row("Email", escapeHtml(data.customerEmail)) : "",
    data.customerPhone ? row("Phone", escapeHtml(data.customerPhone)) : "",
    data.shippingCity
      ? row("Shipping City", escapeHtml(data.shippingCity))
      : "",
  ].join("");

  const bodyHtml = `
    <p style="margin:0 0 16px; font-size:14px; color:${BRAND.slate700};">A new order has just been placed on the store. Details below:</p>
    ${detailsTable(rows)}
    ${data.adminOrderUrl ? button("View Order in Dashboard", data.adminOrderUrl) : ""}
  `;

  const html = layout({
    preheader: `New order #${shortId} - ${formatCurrency(data.total)}`,
    badge: "New Order",
    heading: "\u{1F6D2} New Order Received",
    bodyHtml,
    accentColor: BRAND.amber,
  });

  const text = [
    `New order #${shortId} placed.`,
    `Total: ${formatCurrency(data.total)}`,
    `Items: ${data.itemCount}`,
    `Payment: ${(data.paymentMethod || "N/A").toUpperCase()}`,
    `Customer: ${data.customerName || "Guest"}`,
    data.adminOrderUrl ? `View: ${data.adminOrderUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `New Order #${shortId} - ${formatCurrency(data.total)}`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------------
// Contact form submission alert
// ---------------------------------------------------------------------------

export interface ContactMessageEmailData {
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  message: string;
  adminUrl?: string;
}

export function renderContactMessageEmail(
  data: ContactMessageEmailData,
): RenderedEmail {
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const rows = [
    row("Name", escapeHtml(fullName)),
    data.phone ? row("Phone", escapeHtml(data.phone)) : "",
    data.email ? row("Email", escapeHtml(data.email)) : "",
  ].join("");

  const bodyHtml = `
    <p style="margin:0 0 16px; font-size:14px; color:${BRAND.slate700};">A new contact form submission was received:</p>
    ${detailsTable(rows)}
    <div style="margin-top:16px; padding:16px; background-color:${BRAND.slate100}; border-radius:8px; font-size:14px; line-height:1.5; color:${BRAND.slate900}; white-space:pre-wrap;">${escapeHtml(data.message)}</div>
    ${data.adminUrl ? button("View in Admin Panel", data.adminUrl, BRAND.teal) : ""}
  `;

  const html = layout({
    preheader: `New contact message from ${fullName}`,
    badge: "Contact Us",
    heading: "\u2709\uFE0F New Contact Form Submission",
    bodyHtml,
    accentColor: BRAND.coral,
  });

  const text = [
    `New contact message from ${fullName}`,
    data.phone ? `Phone: ${data.phone}` : "",
    data.email ? `Email: ${data.email}` : "",
    "",
    "Message:",
    data.message,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    subject: `New Contact Message from ${fullName}`,
    html,
    text,
  };
}

// ---------------------------------------------------------------------------
// Daily store report
// ---------------------------------------------------------------------------

export interface DailyReportData {
  dateLabel: string;
  totalRevenue: number;
  newOrders: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredToday: number;
  cancelledToday: number;
  newContactMessages: number;
  adminDashboardUrl?: string;
}

export function renderDailyReportEmail(data: DailyReportData): RenderedEmail {
  const cardsHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>${statCard("Today's Revenue", formatCurrency(data.totalRevenue), BRAND.teal)}${statCard("New Orders", String(data.newOrders), BRAND.navy)}</tr>
      <tr>${statCard("Pending Orders", String(data.pendingOrders), BRAND.amber)}${statCard("Processing Orders", String(data.processingOrders), BRAND.navy)}</tr>
      <tr>${statCard("Delivered Today", String(data.deliveredToday), BRAND.teal)}${statCard("Cancelled Today", String(data.cancelledToday), BRAND.coral)}</tr>
    </table>
  `;

  const bodyHtml = `
    <p style="margin:0 0 20px; font-size:14px; color:${BRAND.slate700};">Here's your store performance summary for <strong>${escapeHtml(data.dateLabel)}</strong>.</p>
    ${cardsHtml}
    ${detailsTable(row("New Contact Messages", String(data.newContactMessages)))}
    ${data.adminDashboardUrl ? button("Open Admin Dashboard", data.adminDashboardUrl, BRAND.teal) : ""}
  `;

  const html = layout({
    preheader: `Daily report for ${data.dateLabel}: ${formatCurrency(data.totalRevenue)} revenue`,
    badge: "Daily Report",
    heading: `\u{1F4CA} Daily Store Report - ${escapeHtml(data.dateLabel)}`,
    bodyHtml,
    accentColor: BRAND.teal,
  });

  const text = [
    `Daily Report (${data.dateLabel})`,
    `Revenue: ${formatCurrency(data.totalRevenue)}`,
    `New Orders: ${data.newOrders}`,
    `Pending Orders: ${data.pendingOrders}`,
    `Processing Orders: ${data.processingOrders}`,
    `Delivered Today: ${data.deliveredToday}`,
    `Cancelled Today: ${data.cancelledToday}`,
    `New Contact Messages: ${data.newContactMessages}`,
  ].join("\n");

  return {
    subject: `Daily Report - ${data.dateLabel} (${formatCurrency(data.totalRevenue)} revenue)`,
    html,
    text,
  };
}
