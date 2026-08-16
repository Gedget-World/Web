import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY")!;
const FAST2SMS_SENDER_ID = Deno.env.get("FAST2SMS_SENDER_ID")!; // your DLT header/sender id
const FAST2SMS_MESSAGE_ID = Deno.env.get("FAST2SMS_MESSAGE_ID")!; // your approved DLT template ID

// The Standard Webhooks library expects the raw base64 secret only —
// strip the "v1,whsec_" prefix that the Supabase dashboard shows you.
const HOOK_SECRET = Deno.env
  .get("SEND_SMS_HOOK_SECRET")!
  .replace("v1,whsec_", "");

Deno.serve(async (req) => {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  // Verify the request actually came from Supabase Auth.
  const wh = new Webhook(HOOK_SECRET);
  // deno-lint-ignore no-explicit-any
  let data: any;
  try {
    data = wh.verify(payload, headers);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const phone: string = data.user.phone; // e.g. "919999999999" (E.164 without '+')
  const otp: string = data.sms.otp;

  // Fast2SMS expects 10-digit Indian numbers, not E.164 with country code.
  const tenDigit = phone.replace(/^\+?91/, "");

  console.log(`[sms-hook] Verified. phone=${tenDigit} otp=${otp}`);

  const fast2smsRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: FAST2SMS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: "dlt",
      sender_id: FAST2SMS_SENDER_ID,
      message: FAST2SMS_MESSAGE_ID, // your approved template's Message ID (not raw text)
      variables_values: otp, // fill your template's {#var#} slot(s), pipe-separated if >1
      numbers: tenDigit,
      flash: 0,
    }),
  });

  const result = await fast2smsRes.json();
  console.log("Fast2SMS response:", JSON.stringify(result));

  if (!result.return) {
    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message: `Fast2SMS delivery failed: ${JSON.stringify(result.message ?? result)}`,
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
