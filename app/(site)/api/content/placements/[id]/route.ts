import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createServiceClient();
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.max_items !== undefined) {
      const maxItems = parseInt(body.max_items, 10);
      if (!Number.isFinite(maxItems) || maxItems < 1) {
        return NextResponse.json(
          { success: false, error: "max_items must be a positive number" },
          { status: 400 },
        );
      }
      updates.max_items = maxItems;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("content_placements")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating placement:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Placement updated successfully",
    });
  } catch (error) {
    console.error("Placement update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update placement" },
      { status: 500 },
    );
  }
}
