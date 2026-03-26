import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> },
) {
  try {
    const supabase = createServiceClient();
    const { roleId } = await params;

    // Fetch role
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("*")
      .eq("id", roleId)
      .single();

    if (roleError || !role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 },
      );
    }

    // Fetch role permissions
    const { data: rolePermData } = await supabase
      .from("role_permissions")
      .select("permission_id")
      .eq("role_id", roleId);

    const permissionIds = rolePermData
      ? rolePermData.map((rp) => rp.permission_id)
      : [];

    return NextResponse.json({
      success: true,
      data: {
        role,
        permissionIds,
      },
    });
  } catch (error) {
    console.error("Role detail error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch role details" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> },
) {
  try {
    const supabase = createServiceClient();
    const { roleId } = await params;
    const { name, description, permissions, existingPermissions } =
      await request.json();

    // Update role
    const { error: updateError } = await supabase
      .from("roles")
      .update({
        name,
        description: description || null,
      })
      .eq("id", roleId);

    if (updateError) {
      if (updateError.code === "23505") {
        return NextResponse.json(
          { success: false, error: "A role with this name already exists" },
          { status: 400 },
        );
      }
      throw updateError;
    }

    // Update permissions if provided
    if (permissions && existingPermissions) {
      // Remove deselected permissions
      const permissionsToRemove = existingPermissions.filter(
        (p: string) => !permissions.includes(p),
      );
      if (permissionsToRemove.length > 0) {
        await supabase
          .from("role_permissions")
          .delete()
          .eq("role_id", roleId)
          .in("permission_id", permissionsToRemove);
      }

      // Add new permissions
      const permissionsToAdd = permissions.filter(
        (p: string) => !existingPermissions.includes(p),
      );
      if (permissionsToAdd.length > 0) {
        await supabase.from("role_permissions").insert(
          permissionsToAdd.map((permId: string) => ({
            role_id: roleId,
            permission_id: permId,
          })),
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Role updated successfully",
    });
  } catch (error) {
    console.error("Role update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update role" },
      { status: 500 },
    );
  }
}
