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
      .from("roles")
      .select("id", { count: "exact", head: true });

    // Get data
    let query = supabase.from("roles").select("*").order("name");

    if (!all) {
      query = query.range(page * limit, page * limit + limit - 1);
    }

    const { data: rolesData, error } = await query;

    if (error) {
      console.error("Error fetching roles:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    // Fetch permission counts for each role
    const rolesWithCounts = await Promise.all(
      (rolesData || []).map(async (role) => {
        const { count } = await supabase
          .from("role_permissions")
          .select("id", { count: "exact", head: true })
          .eq("role_id", role.id);
        return { ...role, permission_count: count || 0 };
      }),
    );

    return NextResponse.json({
      success: true,
      data: rolesWithCounts,
      totalCount: count || 0,
    });
  } catch (error) {
    console.error("Roles fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch roles" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const { name, description, permissions } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Role name is required" },
        { status: 400 },
      );
    }

    // Create role
    const { data: newRole, error: createError } = await supabase
      .from("roles")
      .insert([{ name, description: description || null }])
      .select()
      .single();

    if (createError) {
      if (createError.code === "23505") {
        return NextResponse.json(
          { success: false, error: "A role with this name already exists" },
          { status: 400 },
        );
      }
      throw createError;
    }

    // Add permissions
    if (permissions && permissions.length > 0 && newRole) {
      await supabase.from("role_permissions").insert(
        permissions.map((permId: string) => ({
          role_id: newRole.id,
          permission_id: permId,
        })),
      );
    }

    return NextResponse.json({
      success: true,
      data: newRole,
      message: "Role created successfully",
    });
  } catch (error) {
    console.error("Role creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create role" },
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
        { success: false, error: "Role ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("roles").delete().eq("id", id);

    if (error) {
      console.error("Error deleting role:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Error deleting role. It may be assigned to admins.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Role delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete role" },
      { status: 500 },
    );
  }
}
