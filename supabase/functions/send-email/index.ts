import { corsHeaders } from "../_shared/cors.ts";
import { getDefaultAdminRecipients, sendMail } from "../_shared/mailer.ts";
import {
  type ContactMessageEmailData,
  type DailyReportData,
  type NewOrderEmailData,
  renderContactMessageEmail,
  renderDailyReportEmail,
  renderNewOrderEmail,
} from "../_shared/email-templates.ts";

type RequestBody =
  | { template: "new-order"; data: NewOrderEmailData; to?: string | string[] }
  | {
      template: "contact-message";
      data: ContactMessageEmailData;
      to?: string | string[];
    }
  | { template: "daily-report"; data: DailyReportData; to?: string | string[] }
  | {
      to?: string | string[];
      subject: string;
      text?: string;
      html?: string;
      from?: string;
    };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;

    let subject: string;
    let html: string | undefined;
    let text: string | undefined;
    let from: string | undefined;

    if ("template" in body) {
      const rendered =
        body.template === "new-order"
          ? renderNewOrderEmail(body.data)
          : body.template === "contact-message"
            ? renderContactMessageEmail(body.data)
            : renderDailyReportEmail(body.data);
      subject = rendered.subject;
      html = rendered.html;
      text = rendered.text;
    } else {
      if (!body.subject || (!body.text && !body.html)) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields: 'subject' and 'text' or 'html'",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      subject = body.subject;
      html = body.html;
      text = body.text;
      from = body.from;
    }

    const recipients = body.to ?? getDefaultAdminRecipients();
    if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
      return new Response(
        JSON.stringify({
          error:
            "No recipient specified and ADMIN_NOTIFICATION_EMAILS is not configured",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const info = await sendMail({ to: recipients, subject, text, html, from });

    console.log("[send-email] Message sent:", info.messageId);

    return new Response(JSON.stringify({ messageId: info.messageId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-email] Error sending email:", err);
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
