import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const { session_token } = await request.json();

    if (!session_token) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: "Session token is required",
      });
    }

    // Find session by token
    const { data: session, error: sessionError } = await supabase
      .from("admin_sessions")
      .select("*, admins(*)")
      .eq("session_token", session_token)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: "Invalid session",
      });
    }

    // Check if session has expired
    if (new Date(session.expires_at) < new Date()) {
      // Delete expired session
      await supabase.from("admin_sessions").delete().eq("id", session.id);

      return NextResponse.json({
        success: false,
        valid: false,
        error: "Session has expired",
      });
    }

    // Check if admin is still verified and not locked
    const admin = session.admins;
    if (!admin) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: "Admin not found",
      });
    }

    if (!admin.is_verified) {
      return NextResponse.json({
        success: true,
        valid: false,
        error: "Admin account is not verified",
        is_verified: false,
      });
    }

    if (admin.is_locked) {
      return NextResponse.json({
        success: true,
        valid: false,
        error: "Admin account is locked",
        is_locked: true,
      });
    }

    // Return updated admin data (excluding sensitive fields)
    const {
      password_hash,
      email_verification_token,
      reset_password_token,
      ...safeAdminData
    } = admin;

    return NextResponse.json({
      success: true,
      valid: true,
      admin: safeAdminData,
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json({
      success: false,
      valid: false,
      error: "An error occurred during session validation",
    });
  }
}
