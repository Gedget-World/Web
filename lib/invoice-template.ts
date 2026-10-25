export interface InvoiceItemTemplateData {
  name: string;
  quantity: string;
  unit_price: string;
  total: string;
}

export interface InvoiceTemplateData {
  items: InvoiceItemTemplateData[];
  [key: string]: string | InvoiceItemTemplateData[];
}

export const DEFAULT_INVOICE_TEMPLATE = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice {{invoice_number}}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; color: #111; background: #fff; font: 11px Arial, sans-serif; }
    .invoice { max-width: 900px; margin: 0 auto; }
    table { width: 100%; border-collapse: collapse; }
    .header, .details, .items, .summary { border: 1px solid #777; }
    .header td, .details td { padding: 8px; vertical-align: top; }
    .header .brand { width: 68%; }
    .brand-lockup { display: flex; align-items: center; gap: 10px; }
    .brand-logo { width: 46px; height: 46px; object-fit: contain; }
    h1 { margin: 0; font-size: 19px; }
    .invoice-title { text-align: center; font-size: 15px; font-weight: bold; }
    .invoice-title small { display: block; margin-top: 7px; font-size: 10px; font-weight: normal; }
    .details { margin-top: 8px; }
    .details td { width: 50%; line-height: 1.5; }
    .section-title { display: block; margin-bottom: 4px; font-weight: bold; }
    .muted { color: #444; }
    .items { margin-top: 8px; }
    th, td { padding: 6px 5px; border: 1px solid #999; text-align: left; }
    th { font-weight: bold; background: #f3f3f3; }
    .number { text-align: right; white-space: nowrap; }
    .items tbody tr { break-inside: avoid; }
    .summary { width: 52%; margin: 8px 0 0 auto; }
    .summary td { padding: 5px 7px; }
    .summary .total td { font-weight: bold; }
    .footer { margin-top: 14px; padding-top: 8px; border-top: 1px solid #777; text-align: center; }
    @page { size: A4; margin: 10mm; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <main class="invoice">
    <table class="header">
      <tr>
        <td class="brand">
          <div class="brand-lockup"><img class="brand-logo" src="{{store_logo}}" alt="{{store_name}} logo"><h1>{{store_name}}</h1></div>
        </td>
        <td>
          <div class="invoice-title">INVOICE<small>Invoice No: {{invoice_number}}<br>Invoice Date: {{invoice_date}}</small></div>
        </td>
      </tr>
    </table>
    <table class="details">
      <tr>
        <td><span class="section-title">Bill to</span><strong>{{customer_name}}</strong><br>{{customer_email}}<br>{{customer_phone}}<br><span class="muted">{{shipping_address}}</span></td>
        <td><span class="section-title">Order details</span><strong>Order ID:</strong> {{order_id}}<br><strong>Order date:</strong> {{order_date}}<br><strong>Delivery address:</strong> {{shipping_address}}</td>
      </tr>
    </table>
    <table class="items">
      <thead><tr><th>Item</th><th class="number">Qty</th><th class="number">Unit price</th><th class="number">Amount</th></tr></thead>
      <tbody>{{#items}}<tr><td>{{name}}</td><td class="number">{{quantity}}</td><td class="number">{{currency_symbol}}{{unit_price}}</td><td class="number">{{currency_symbol}}{{total}}</td></tr>{{/items}}</tbody>
    </table>
    <table class="summary">
      <tbody>
        <tr><td>Subtotal</td><td class="number">{{currency_symbol}}{{subtotal}}</td></tr>
        <tr><td>Discount</td><td class="number">-{{currency_symbol}}{{discount}}</td></tr>
        <tr><td>Shipping</td><td class="number">{{shipping}}</td></tr>
        <tr class="total"><td>Total</td><td class="number">{{currency_symbol}}{{total}}</td></tr>
      </tbody>
    </table>
    <footer class="footer muted">Thank you for shopping with {{store_name}}.</footer>
  </main>
</body>
</html>`;

export function escapeInvoiceHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderInvoiceTemplate(
  template: string,
  data: InvoiceTemplateData,
): string {
  const itemTemplate = /{{#items}}([\s\S]*?){{\/items}}/g;
  const withItems = template.replace(itemTemplate, (_match, itemMarkup: string) =>
    data.items
      .map((item) =>
        itemMarkup.replace(/{{\s*([a-z_]+)\s*}}/gi, (_token, key: string) => {
          const itemValue = item[key as keyof InvoiceItemTemplateData];
          const value = itemValue ?? data[key];
          return typeof value === "string" ? escapeInvoiceHtml(value) : "";
        }),
      )
      .join(""),
  );

  return withItems.replace(/{{\s*([a-z_]+)\s*}}/gi, (_token, key: string) => {
    const value = data[key];
    return typeof value === "string" ? escapeInvoiceHtml(value) : "";
  });
}

export function buildInvoiceDocument(renderedTemplate: string): string {
  const policy =
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src \'self\' data: blob:; font-src data:; base-uri \'none\'; form-action \'none\'; frame-src \'none\'; object-src \'none\'">';
  if (/<head(?:\s[^>]*)?>/i.test(renderedTemplate)) {
    return renderedTemplate.replace(/<head(?:\s[^>]*)?>/i, (head) => `${head}${policy}`);
  }

  return `<!doctype html><html><head><meta charset="utf-8">${policy}</head><body>${renderedTemplate}</body></html>`;
}
