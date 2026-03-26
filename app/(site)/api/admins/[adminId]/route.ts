import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ adminId: string }> },
) {
  try {
    const supabase = getSupabaseClient();
    const { adminId } = await params;

    // Fetch admin
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("*")
      .eq("id", adminId)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin not found",
        },
        { status: 404 },
      );
    }

    let role = null;
    let rolePermissions: any[] = [];

    // Fetch role if exists
    if (admin.role_id) {
      const { data: roleData } = await supabase
        .from("roles")
        .select("*")
        .eq("id", admin.role_id)
        .single();

      if (roleData) {
        role = roleData;

        // Fetch permissions for this role
        const { data: rolePermData } = await supabase
          .from("role_permissions")
          .select(
            `
            permissions (
              id,
              name,
              description
            )
          `,
          )
          .eq("role_id", admin.role_id);

        if (rolePermData) {
          rolePermissions = rolePermData
            .map((rp: any) => rp.permissions)
            .filter(Boolean);
        }
      }
    }

    // Fetch direct permissions for this admin
    const { data: adminPermData } = await supabase
      .from("admin_permissions")
      .select(
        `
        permissions (
          id,
          name,
          description
        )
      `,
      )
      .eq("admin_id", adminId);

    const directPermissions = adminPermData
      ? adminPermData.map((ap: any) => ap.permissions).filter(Boolean)
      : [];

    // Fetch recent audit logs for this admin
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select("id, action, entity, entity_id, created_at, ip_address")
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        admin,
        role,
        rolePermissions,
        directPermissions,
        auditLogs: auditLogs || [],
      },
    });
  } catch (error) {
    console.error("Admin detail error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch admin details",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ adminId: string }> },
) {
  try {
    const supabase = getSupabaseClient();
    const { adminId } = await params;
    const body = await request.json();

    const {
      email,
      password,
      name,
      role_id,
      is_verified,
      permissions,
      existingPermissions,
    } = body;

    // Validate email if changed
    if (email) {
      const { data: existingAdmin } = await supabase
        .from("admins")
        .select("id")
        .eq("email", email.toLowerCase())
        .neq("id", adminId)
        .maybeSingle();

      if (existingAdmin) {
        return NextResponse.json(
          { success: false, error: "Email already exists" },
          { status: 400 },
        );
      }
    }

    // Build update data
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (email) {
      updateData.email = email.toLowerCase();
    }
    if (name !== undefined) {
      updateData.name = name || null;
    }
    if (role_id !== undefined) {
      updateData.role_id = role_id || null;
    }
    if (is_verified !== undefined) {
      updateData.is_verified = is_verified;
    }

    // Hash and update password if provided
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 12);
    }

    // Update admin
    const { error: updateError } = await supabase
      .from("admins")
      .update(updateData)
      .eq("id", adminId);

    if (updateError) {
      console.error("Error updating admin:", updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 },
      );
    }

    // Update permissions if provided
    if (permissions && existingPermissions) {
      // Remove deselected permissions
      const permissionsToRemove = existingPermissions.filter(
        (p: string) => !permissions.includes(p),
      );
      if (permissionsToRemove.length > 0) {
        await supabase
          .from("admin_permissions")
          .delete()
          .eq("admin_id", adminId)
          .in("permission_id", permissionsToRemove);
      }

      // Add new permissions
      const permissionsToAdd = permissions.filter(
        (p: string) => !existingPermissions.includes(p),
      );
      if (permissionsToAdd.length > 0) {
        await supabase.from("admin_permissions").insert(
          permissionsToAdd.map((permId: string) => ({
            admin_id: adminId,
            permission_id: permId,
          })),
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Admin updated successfully",
    });
  } catch (error) {
    console.error("Admin update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update admin" },
      { status: 500 },
    );
  }
}
