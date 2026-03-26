import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { headers } from "next/headers";

const MAX_FAILED_ATTEMPTS = 5;
const SESSION_EXPIRY_HOURS = 24;

// Generate a secure session token
function generateSessionToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const { email, password } = await request.json();

    // Get request headers for audit
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || null;
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0].trim() || "unknown";

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: "Email and password are required",
        status: 400,
      });
    }

    // Find admin by email
    const { data: admin, error: fetchError } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (fetchError || !admin) {
      return NextResponse.json({
        success: false,
        error: "Invalid email or password",
        status: 400,
      });
    }

    // Check if account is locked
    if (admin.is_locked) {
      return NextResponse.json({
        success: false,
        error:
          "Account is locked due to too many failed login attempts. Please contact an administrator.",
        status: 400,
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = (admin.failed_login_attempts || 0) + 1;
      const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS;

      await supabase
        .from("admins")
        .update({
          failed_login_attempts: newFailedAttempts,
          is_locked: shouldLock,
        })
        .eq("id", admin.id);

      if (shouldLock) {
        return NextResponse.json({
          success: false,
          error:
            "Account has been locked due to too many failed login attempts.",
          status: 400,
        });
      }

      return NextResponse.json({
        success: false,
        error: "Invalid email or password",
        status: 400,
      });
    }

    // Update last login and reset failed attempts
    await supabase
      .from("admins")
      .update({
        last_login_at: new Date().toISOString(),
        failed_login_attempts: 0,
      })
      .eq("id", admin.id);

    // Generate session token
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(
      Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    // Create session
    await supabase.from("admin_sessions").insert([
      {
        admin_id: admin.id,
        session_token: sessionToken,
        user_agent: userAgent,
        ip_address: ipAddress,
        expires_at: expiresAt.toISOString(),
      },
    ]);

    // Log the login action
    await supabase.from("audit_logs").insert([
      {
        admin_id: admin.id,
        action: "LOGIN",
        entity: "admins",
        entity_id: admin.id,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    ]);

    // Return admin data (excluding sensitive fields)
    const {
      password_hash,
      email_verification_token,
      reset_password_token,
      ...safeAdminData
    } = admin;

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      data: {
        ...safeAdminData,
        session_token: sessionToken,
        session_expires_at: expiresAt.toISOString(),
      },
      status: 201,
    });

    // Set HTTP-only cookie for middleware protection
    response.cookies.set("admin_session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during login",
      },
      { status: 500 },
    );
  }
}
