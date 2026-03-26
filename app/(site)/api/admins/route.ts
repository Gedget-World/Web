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

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get total count
    const { count } = await supabase
      .from("admins")
      .select("id", { count: "exact", head: true });

    // Get paginated data
    const { data, error } = await supabase
      .from("admins")
      .select(
        `
        id,
        email,
        name,
        is_verified,
        is_locked,
        role_id,
        created_at,
        updated_at,
        last_login_at,
        roles (
          id,
          name
        )
      `,
      )
      .order("created_at", { ascending: false })
      .range(page * limit, page * limit + limit - 1);

    if (error) {
      console.error("Error fetching admins:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      totalCount: count || 0,
    });
  } catch (error) {
    console.error("Admin list error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch admins",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { id, is_verified } = await request.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin ID is required",
        },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("admins")
      .update({
        is_verified,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating admin:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Admin updated successfully",
    });
  } catch (error) {
    console.error("Admin update error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update admin",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { email, password, name, role_id, is_verified, permissions } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Check if email already exists
    const { data: existingAdmin } = await supabase
      .from("admins")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 400 },
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin
    const { data: newAdmin, error: createError } = await supabase
      .from("admins")
      .insert([
        {
          email: email.toLowerCase(),
          password_hash: passwordHash,
          name: name || null,
          role_id: role_id || null,
          is_verified: is_verified || false,
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error("Error creating admin:", createError);
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 500 },
      );
    }

    // Add direct permissions if provided
    if (permissions && permissions.length > 0 && newAdmin) {
      const { error: permError } = await supabase
        .from("admin_permissions")
        .insert(
          permissions.map((permId: string) => ({
            admin_id: newAdmin.id,
            permission_id: permId,
          })),
        );

      if (permError) {
        console.error("Error adding permissions:", permError);
      }
    }

    return NextResponse.json({
      success: true,
      data: newAdmin,
      message: "Admin created successfully",
    });
  } catch (error) {
    console.error("Admin creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create admin" },
      { status: 500 },
    );
  }
}
