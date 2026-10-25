import { corsHeaders } from "../_shared/cors.ts";
import {
  getDefaultAdminRecipients,
  MONITORING_EMAIL,
  sendMail,
} from "../_shared/mailer.ts";
import {
  type ContactMessageEmailData,
  type DailyReportData,
  type NewOrderEmailData,
  renderContactMessageEmail,
  renderDailyReportEmail,
  renderGenericEmail,
  renderNewOrderEmail,
} from "../_shared/email-templates.ts";

type EmailRouting = {
  to?: string | string[];
  from?: string;
};

type RequestBody =
  | ({ template: "new-order"; data: NewOrderEmailData } & EmailRouting)
  | {
      template: "contact-message";
      data: ContactMessageEmailData;
      recipients?: string | string[];
    } & EmailRouting
  | ({ template: "daily-report"; data: DailyReportData } & EmailRouting)
  | ({
      template: "generic";
      subject: string;
      body: string;
      recipients?: string | string[];
    } & EmailRouting)
  | {
      recipients?: string | string[];
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
            : body.template === "daily-report"
              ? renderDailyReportEmail(body.data)
              : body.template === "generic" &&
                  typeof body.subject === "string" &&
                  body.subject.trim() &&
                  typeof body.body === "string"
                ? renderGenericEmail(body.subject, body.body)
                : undefined;

      if (!rendered) {
        return new Response(
          JSON.stringify({
            error: body.template === "generic"
              ? "Generic template requires 'subject' and 'body' fields"
              : "Unsupported email template",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      subject = rendered.subject;
      html = rendered.html;
      text = rendered.text;
      from = body.from;
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

    const recipients =
      ("recipients" in body ? body.recipients : undefined) ??
      body.to ??
      getDefaultAdminRecipients();
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

    // Send a single message with every recipient BCC'd, rather than one
    // per address or a shared "to" list that exposes everyone's email.
    const info = await sendMail({
      to: MONITORING_EMAIL,
      bcc: recipients,
      subject,
      text,
      html,
      from,
    });

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
