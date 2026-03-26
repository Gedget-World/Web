import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");
    const all = searchParams.get("all") === "true";

    // Get total count
    const { count } = await supabase
      .from("permissions")
      .select("id", { count: "exact", head: true });

    // Get data
    let query = supabase.from("permissions").select("*").order("name");

    if (!all) {
      query = query.range(page * limit, page * limit + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching permissions:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      totalCount: count || 0,
    });
  } catch (error) {
    console.error("Permissions fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch permissions" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Permission name is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("permissions")
      .insert([
        {
          name: name.toLowerCase().replace(/\s+/g, "_"),
          description: description || null,
        },
      ])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "A permission with this name already exists",
          },
          { status: 400 },
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Permission created successfully",
    });
  } catch (error) {
    console.error("Permission creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create permission" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createServiceClient();
    const { id, name, description } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Permission ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("permissions")
      .update({
        name,
        description: description || null,
      })
      .eq("id", id);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "A permission with this name already exists",
          },
          { status: 400 },
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Permission updated successfully",
    });
  } catch (error) {
    console.error("Permission update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update permission" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Permission ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("permissions").delete().eq("id", id);

    if (error) {
      console.error("Error deleting permission:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Error deleting permission. It may be in use.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Permission deleted successfully",
    });
  } catch (error) {
    console.error("Permission delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete permission" },
      { status: 500 },
    );
  }
}
