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

// GET - Fetch all collections ordered by display_order
export async function GET() {
  try {
    const isValid = await validateAdminSession();
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("collections")
      .select(
        "id, name, slug, image_url, is_active, display_order, parent_id, parent:parent_id(name)",
      )
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching collections:", error);
      return NextResponse.json(
        { error: "Failed to fetch collections" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in collections reorder GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update collection display orders
export async function PUT(request: NextRequest) {
  try {
    const isValid = await validateAdminSession();
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { collections } = body as {
      collections: Array<{ id: string; display_order: number }>;
    };

    if (!collections || !Array.isArray(collections)) {
      return NextResponse.json(
        { error: "Invalid request body. Expected 'collections' array." },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();

    // Update each collection's display_order
    const updatePromises = collections.map(({ id, display_order }) =>
      supabase.from("collections").update({ display_order }).eq("id", id),
    );

    const results = await Promise.all(updatePromises);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error("Errors updating collections:", errors);
      return NextResponse.json(
        { error: "Failed to update some collections" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, updated: collections.length });
  } catch (error) {
    console.error("Error in collections reorder PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
