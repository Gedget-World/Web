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

  if (new Date(session.expires_at) < new Date()) {
    return false;
  }

  return true;
}

// PATCH - Update a review's is_active / is_approved status (moderation only)
export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await validateAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, is_active, is_approved } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing review id" }, { status: 400 });
    }

    if (typeof is_active !== "boolean" && typeof is_approved !== "boolean") {
      return NextResponse.json(
        { error: "Must provide is_active and/or is_approved as a boolean" },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (typeof is_active === "boolean") updates.is_active = is_active;
    if (typeof is_approved === "boolean") updates.is_approved = is_approved;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating review:", error);
      return NextResponse.json(
        { error: "Failed to update review" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in reviews PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
