import nodemailer from "npm:nodemailer@6";

const EMAIL_USER = Deno.env.get("email_user")!;
const EMAIL_APP_PASSWORD = Deno.env.get("email_app_password")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_APP_PASSWORD,
  },
});

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, text, html, from } =
      (await req.json()) as SendEmailRequest;

    if (!to || !subject || (!text && !html)) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: 'to', 'subject', and 'text' or 'html'",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const info = await transporter.sendMail({
      from:
        from ??
        '"Gadget Kabila Monitoring" <gadgetskabilamonitoring@gmail.com>',
      to,
      subject,
      text,
      html,
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
