import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> },
) {
  try {
    const { roleId } = await params;
    const supabase = createServiceClient();

    // Fetch permissions associated with this role via role_permissions join table
    const { data, error } = await supabase
      .from("role_permissions")
      .select(
        `
        permission_id,
        permissions:permission_id (
          id,
          name,
          description
        )
      `,
      )
      .eq("role_id", roleId);

    if (error) {
      console.error("Error fetching role permissions:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    // Extract the permissions from the joined data
    const permissions =
      data?.map((rp: any) => rp.permissions).filter(Boolean) || [];

    return NextResponse.json({ success: true, data: permissions });
  } catch (error) {
    console.error("Role permissions fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch role permissions" },
      { status: 500 },
    );
  }
}
