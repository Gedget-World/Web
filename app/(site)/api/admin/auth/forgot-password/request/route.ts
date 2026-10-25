import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import {
  createOtp,
  hashResetValue,
  OTP_EXPIRY_MS,
  serializeResetState,
} from "../shared";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_RESPONSE = {
  success: true,
  message: "If an admin account exists for that email, a code will be sent shortly.",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { success: false, error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { data: admin, error: lookupError } = await supabase
      .from("admins")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error("Admin password reset lookup failed:", lookupError);
      return NextResponse.json(
        { success: false, error: "Unable to process the request right now." },
        { status: 500 },
      );
    }

    if (!admin) return NextResponse.json(GENERIC_RESPONSE);

    const otp = createOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
    const { error: updateError } = await supabase
      .from("admins")
      .update({
        reset_password_token: serializeResetState({
          kind: "otp",
          hash: hashResetValue(otp),
          attempts: 0,
        }),
        reset_password_expires: expiresAt,
      })
      .eq("id", admin.id);

    if (updateError) {
      console.error("Admin password reset token update failed:", updateError);
      return NextResponse.json(
        { success: false, error: "Unable to process the request right now." },
        { status: 500 },
      );
    }

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Missing Supabase email service configuration");
      }

      const emailResponse = await fetch(
        `${supabaseUrl}/functions/v1/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            template: "generic",
            subject: "Admin password reset code",
            body: `Your admin password reset code is ${otp}.\n\nThis code expires in 2 minutes. If you did not request a password reset, you can ignore this email.`,
            to: admin.email,
          }),
        },
      );

      if (!emailResponse.ok) {
        throw new Error(
          `Email service returned ${emailResponse.status}: ${await emailResponse.text()}`,
        );
      }
    } catch (emailError) {
      console.error("Admin password reset email delivery failed:", emailError);
      const { error: clearError } = await supabase
        .from("admins")
        .update({
          reset_password_token: null,
          reset_password_expires: null,
        })
        .eq("id", admin.id);
      if (clearError) {
        console.error("Failed to clear undelivered admin OTP:", clearError);
      }
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error("Admin password reset request failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to process the request right now." },
      { status: 500 },
    );
  }
}
