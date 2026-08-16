import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getDefaultAdminRecipients, sendMail } from "../_shared/mailer.ts";
import { renderDailyReportEmail } from "../_shared/email-templates.ts";

// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected into every Edge Function.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // store operates on India Standard Time

function getTodayRangeIst() {
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const istMidnight = Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate(),
  );
  const startIso = new Date(istMidnight - IST_OFFSET_MS).toISOString();
  const dateLabel = istNow.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return { startIso, endIso: now.toISOString(), dateLabel };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { startIso, endIso, dateLabel } = getTodayRangeIst();

    const [
      { data: todaysOrders, error: todaysOrdersError },
      { count: pendingOrders },
      { count: processingOrders },
      { count: deliveredToday },
      { count: cancelledToday },
      { count: newContactMessages },
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("total, status")
        .gte("created_at", startIso)
        .lte("created_at", endIso),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "processing"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "delivered")
        .gte("updated_at", startIso)
        .lte("updated_at", endIso),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "cancelled")
        .gte("updated_at", startIso)
        .lte("updated_at", endIso),
      supabase
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startIso)
        .lte("created_at", endIso),
    ]);

    if (todaysOrdersError) throw todaysOrdersError;

    const newOrders = todaysOrders?.length ?? 0;
    const totalRevenue = (todaysOrders ?? [])
      .filter((o) => !["cancelled", "payment_failed"].includes(o.status))
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const reportData = {
      dateLabel,
      totalRevenue,
      newOrders,
      pendingOrders: pendingOrders ?? 0,
      processingOrders: processingOrders ?? 0,
      deliveredToday: deliveredToday ?? 0,
      cancelledToday: cancelledToday ?? 0,
      newContactMessages: newContactMessages ?? 0,
    };

    const recipients = getDefaultAdminRecipients();
    if (recipients.length === 0) {
      throw new Error("ADMIN_NOTIFICATION_EMAILS is not configured");
    }

    const { subject, html, text } = renderDailyReportEmail(reportData);
    const info = await sendMail({ to: recipients, subject, html, text });

    console.log("[daily-report] Report sent:", info.messageId, reportData);

    return new Response(
      JSON.stringify({ messageId: info.messageId, report: reportData }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[daily-report] Error generating/sending report:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
