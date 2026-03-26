import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const { session_token } = await request.json();

    // Get request headers for audit
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || null;
    const forwardedFor = headersList.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0].trim() || "unknown";

    if (!session_token) {
      return NextResponse.json({
        success: false,
        error: "Session token is required",
      });
    }

    // Find session by token to get admin_id for audit log
    const { data: session } = await supabase
      .from("admin_sessions")
      .select("admin_id")
      .eq("session_token", session_token)
      .single();

    // Delete the session
    const { error: deleteError } = await supabase
      .from("admin_sessions")
      .delete()
      .eq("session_token", session_token);

    if (deleteError) {
      console.error("Error deleting session:", deleteError);
    }

    // Log the logout action if we found the session
    if (session?.admin_id) {
      await supabase.from("audit_logs").insert([
        {
          admin_id: session.admin_id,
          action: "LOGOUT",
          entity: "admins",
          entity_id: session.admin_id,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      ]);
    }

    // Create response and clear the session cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear the HTTP-only cookie
    response.cookies.set("admin_session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(0), // Expire immediately
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({
      success: false,
      error: "An error occurred during logout",
    });
  }
}
