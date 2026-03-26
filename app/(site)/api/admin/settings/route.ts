import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cookies } from "next/headers";

// Validate admin session
async function validateAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session_token")?.value;

  if (!sessionToken) {
    return false;
  }

  const supabase = createServiceClient();

  const { data: session, error } = await supabase
    .from("admin_sessions")
    .select("admin_id, expires_at")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session) {
    return false;
  }

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    return false;
  }

  return true;
}

// GET - Fetch all settings
export async function GET() {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .order("category")
      .order("display_order");

    if (error) {
      console.error("Error fetching settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch settings" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in settings GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    // Validate admin session
    const isAdmin = await validateAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: "Invalid request body. Expected { settings: [...] }" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // Update each setting
    const errors: string[] = [];
    for (const setting of settings) {
      const { setting_key, setting_value } = setting;

      if (!setting_key) {
        errors.push("Missing setting_key");
        continue;
      }

      const { error } = await supabase
        .from("store_settings")
        .update({ setting_value })
        .eq("setting_key", setting_key);

      if (error) {
        console.error(`Error updating ${setting_key}:`, error);
        errors.push(`Failed to update ${setting_key}`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Some settings failed to update", details: errors },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error in settings PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Update a single setting
export async function PATCH(request: NextRequest) {
  try {
    // Validate admin session
    const isAdmin = await validateAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { setting_key, setting_value } = body;

    if (!setting_key) {
      return NextResponse.json(
        { error: "setting_key is required" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("store_settings")
      .update({ setting_value })
      .eq("setting_key", setting_key);

    if (error) {
      console.error("Error updating setting:", error);
      return NextResponse.json(
        { error: "Failed to update setting" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Setting updated successfully" });
  } catch (error) {
    console.error("Error in settings PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
