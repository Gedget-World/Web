import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import BASE_LOGO from "@/content/assets/logo/base-logo.png";
import {
  DEFAULT_INVOICE_TEMPLATE,
  renderInvoiceTemplate,
  type InvoiceItemTemplateData,
  type InvoiceTemplateData,
} from "@/lib/invoice-template";

function formatAmount(value: unknown): string {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await context.params;
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(quantity, price, products(name))")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: "An invoice is available after the order is delivered" },
        { status: 409 },
      );
    }

    const serviceClient = createServiceClient();
    const { data: settings, error: settingsError } = await serviceClient
      .from("store_settings")
      .select("setting_key, setting_value")
      .in("setting_key", [
        "invoice_template_html",
        "currency_symbol",
        "store_name",
      ]);

    if (settingsError) {
      console.error("Error loading invoice settings:", settingsError);
      return NextResponse.json(
        { error: "Failed to load invoice settings" },
        { status: 500 },
      );
    }

    const settingValues = Object.fromEntries(
      (settings || []).map((setting) => [
        setting.setting_key,
        setting.setting_value,
      ]),
    );
    const currencySymbol = settingValues.currency_symbol || "₹";
    const items: InvoiceItemTemplateData[] = (order.order_items || []).map(
      (item: {
        quantity: number;
        price: number;
        products?: { name?: string | null } | null;
      }) => {
        const quantity = Number(item.quantity) || 0;
        const price = Number(item.price) || 0;
        return {
          name: item.products?.name || "Product",
          quantity: String(quantity),
          unit_price: formatAmount(price),
          total: formatAmount(price * quantity),
        };
      },
    );
    const subtotal = items.reduce(
      (sum, item) =>
        sum + Number(item.unit_price) * Number(item.quantity),
      0,
    );
    const orderDate = new Date(order.created_at);
    const data: InvoiceTemplateData = {
      store_name: settingValues.store_name || "Gadgets Kabila",
      store_logo: BASE_LOGO.src,
      invoice_number: order.invoice_number || order.id.slice(0, 8).toUpperCase(),
      invoice_date: new Date(order.invoice_date || order.created_at).toLocaleDateString(
        "en-IN",
        { day: "numeric", month: "short", year: "numeric" },
      ),
      order_id: order.id.slice(0, 8).toUpperCase(),
      order_date: orderDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      customer_name: order.customer_name || "",
      customer_email: order.customer_email || user.email || "",
      customer_phone: order.customer_phone || "",
      shipping_address: [
        order.shipping_address,
        order.shipping_city,
        order.shipping_postal_code,
        order.shipping_country,
      ]
        .filter(Boolean)
        .join(", "),
      currency_symbol: currencySymbol,
      subtotal: formatAmount(subtotal),
      discount: formatAmount(order.discount_amount),
      shipping: "Free",
      total: formatAmount(order.total),
      items,
    };

    return NextResponse.json({
      html: renderInvoiceTemplate(
        settingValues.invoice_template_html || DEFAULT_INVOICE_TEMPLATE,
        data,
      ),
      filename: `invoice-${data.invoice_number}`,
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 },
    );
  }
}
