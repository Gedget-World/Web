import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  matchesResetValue,
  parseResetState,
} from "../shared";

const SESSION_EXPIRY_HOURS = 24;

function generateSessionToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      resetToken?: unknown;
      password?: unknown;
    };
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const resetToken =
      typeof body.resetToken === "string" ? body.resetToken : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^[a-f0-9]{64}$/i.test(resetToken)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired password reset." },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { data: admin, error: lookupError } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error("Admin password reset lookup failed:", lookupError);
      return NextResponse.json(
        { success: false, error: "Unable to reset the password right now." },
        { status: 500 },
      );
    }

    const resetState = parseResetState(admin?.reset_password_token);
    const expiresAt = admin?.reset_password_expires
      ? new Date(admin.reset_password_expires).getTime()
      : 0;

    if (
      !admin ||
      !resetState ||
      resetState.kind !== "reset" ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now() ||
      !matchesResetValue(resetState.hash, resetToken)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired password reset." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const sessionToken = generateSessionToken();
    const expires = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
    const userAgent = request.headers.get("user-agent");
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

    const { data: updatedRows, error: updateError } = await supabase
      .from("admins")
      .update({
        password_hash: passwordHash,
        reset_password_token: null,
        reset_password_expires: null,
        failed_login_attempts: 0,
        is_locked: false,
      })
      .eq("id", admin.id)
      .eq("reset_password_token", admin.reset_password_token)
      .select("id");

    if (updateError) {
      console.error("Admin password update failed:", updateError);
      return NextResponse.json(
        { success: false, error: "Unable to reset the password right now." },
        { status: 500 },
      );
    }
    if (!updatedRows?.length) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired password reset." },
        { status: 400 },
      );
    }

    const { error: deleteError } = await supabase
      .from("admin_sessions")
      .delete()
      .eq("admin_id", admin.id);

    if (deleteError) {
      console.error("Admin session invalidation failed:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: "Password changed, but existing sessions could not be invalidated. Please contact support.",
        },
        { status: 500 },
      );
    }

    const { error: sessionError } = await supabase.from("admin_sessions").insert({
      admin_id: admin.id,
      session_token: sessionToken,
      user_agent: userAgent,
      ip_address: ipAddress,
      expires_at: expires.toISOString(),
    });

    if (sessionError) {
      console.error("New admin session creation failed:", sessionError);
      return NextResponse.json(
        {
          success: false,
          error: "Password changed, but a new session could not be created. Please sign in.",
        },
        { status: 500 },
      );
    }

    const { error: auditError } = await supabase.from("audit_logs").insert({
      admin_id: admin.id,
      action: "PASSWORD_RESET",
      entity: "admins",
      entity_id: admin.id,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    if (auditError) {
      console.error("Admin password reset audit log failed:", auditError);
    }

    const {
      password_hash: _passwordHash,
      email_verification_token: _emailVerificationToken,
      reset_password_token: _resetPasswordToken,
      reset_password_expires: _resetPasswordExpires,
      ...safeAdminData
    } = {
      ...admin,
      failed_login_attempts: 0,
      is_locked: false,
    };

    const response = NextResponse.json({
      success: true,
      data: {
        ...safeAdminData,
        session_token: sessionToken,
        session_expires_at: expires.toISOString(),
      },
    });
    response.cookies.set("admin_session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin password reset failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to reset the password right now." },
      { status: 500 },
    );
  }
}
