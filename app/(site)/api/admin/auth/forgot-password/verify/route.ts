import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import {
  createResetToken,
  hashResetValue,
  matchesResetValue,
  MAX_OTP_ATTEMPTS,
  parseResetState,
  RESET_TOKEN_EXPIRY_MS,
  serializeResetState,
} from "../shared";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      otp?: unknown;
    };
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code." },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { data: admin, error: lookupError } = await supabase
      .from("admins")
      .select("id, reset_password_token, reset_password_expires")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error("Admin OTP lookup failed:", lookupError);
      return NextResponse.json(
        { success: false, error: "Unable to verify the code right now." },
        { status: 500 },
      );
    }

    const state = parseResetState(admin?.reset_password_token);
    const expiresAt = admin?.reset_password_expires
      ? new Date(admin.reset_password_expires).getTime()
      : 0;

    if (
      !admin ||
      !state ||
      state.kind !== "otp" ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now()
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code." },
        { status: 400 },
      );
    }

    if (!matchesResetValue(state.hash, otp)) {
      const attempts = state.attempts + 1;
      const { data: updatedRows, error: updateError } = await supabase
        .from("admins")
        .update(
          attempts >= MAX_OTP_ATTEMPTS
            ? {
                reset_password_token: null,
                reset_password_expires: null,
              }
            : {
                reset_password_token: serializeResetState({
                  ...state,
                  attempts,
                }),
              },
        )
        .eq("id", admin.id)
        .eq("reset_password_token", admin.reset_password_token)
        .select("id");

      if (updateError) {
        console.error("Admin OTP attempt update failed:", updateError);
        return NextResponse.json(
          { success: false, error: "Unable to verify the code right now." },
          { status: 500 },
        );
      }
      if (!updatedRows?.length) {
        return NextResponse.json(
          { success: false, error: "Invalid or expired verification code." },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code." },
        { status: 400 },
      );
    }

    const resetToken = createResetToken();
    const { data: updatedRows, error: updateError } = await supabase
      .from("admins")
      .update({
        reset_password_token: serializeResetState({
          kind: "reset",
          hash: hashResetValue(resetToken),
        }),
        reset_password_expires: new Date(
          Date.now() + RESET_TOKEN_EXPIRY_MS,
        ).toISOString(),
      })
      .eq("id", admin.id)
      .eq("reset_password_token", admin.reset_password_token)
      .select("id");

    if (updateError) {
      console.error("Admin OTP verification update failed:", updateError);
      return NextResponse.json(
        { success: false, error: "Unable to verify the code right now." },
        { status: 500 },
      );
    }
    if (!updatedRows?.length) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, resetToken });
  } catch (error) {
    console.error("Admin OTP verification failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to verify the code right now." },
      { status: 500 },
    );
  }
}
