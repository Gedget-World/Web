import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const { session_token } = await request.json();

    if (!session_token) {
      return NextResponse.json({
        success: false,
        error: "Session token is required",
      });
    }

    // Delete session by token
    const { error } = await supabase
      .from("admin_sessions")
      .delete()
      .eq("session_token", session_token);

    if (error) {
      console.error("Error deleting session:", error);
      return NextResponse.json({
        success: false,
        error: "Failed to delete session",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Session deletion error:", error);
    return NextResponse.json({
      success: false,
      error: "An error occurred during session deletion",
    });
  }
}
