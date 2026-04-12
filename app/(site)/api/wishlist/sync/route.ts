import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/wishlist/sync - Sync localStorage wishlist items to database on sign-in
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productIds } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No items to sync",
        synced: 0,
      });
    }

    // Validate that all product IDs exist
    const { data: validProducts, error: productsError } = await supabase
      .from("products")
      .select("id")
      .in("id", productIds);

    if (productsError) {
      console.error("Error validating products:", productsError);
      return NextResponse.json(
        { error: productsError.message },
        { status: 400 },
      );
    }

    const validProductIds = validProducts?.map((p) => p.id) || [];

    if (validProductIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No valid products to sync",
        synced: 0,
      });
    }

    // Prepare wishlist items for bulk insert
    const wishlistItems = validProductIds.map((productId) => ({
      user_id: user.id,
      product_id: productId,
    }));

    // Bulk upsert (ignore duplicates)
    const { data, error } = await supabase
      .from("wishlist")
      .upsert(wishlistItems, {
        onConflict: "user_id,product_id",
        ignoreDuplicates: true,
      })
      .select();

    if (error) {
      console.error("Error syncing wishlist:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Wishlist synced successfully",
      synced: data?.length || 0,
    });
  } catch (error) {
    console.error("Error syncing wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
