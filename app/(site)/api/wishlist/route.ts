import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/wishlist - Fetch user's wishlist with product details
export async function GET() {
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

    // Fetch wishlist items with product details
    const { data: wishlistItems, error } = await supabase
      .from("wishlist")
      .select(
        `
        id,
        product_id,
        created_at,
        products (
          id,
          name,
          slug,
          description,
          price,
          image_url,
          stock,
          discount_percentage,
          is_new_arrival,
          is_featured
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching wishlist:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Transform the data to flatten product info
    const items = wishlistItems.map((item) => ({
      id: item.id,
      productId: item.product_id,
      createdAt: item.created_at,
      product: item.products,
    }));

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/wishlist - Add a product to wishlist
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
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Insert into wishlist (upsert to handle duplicates gracefully)
    const { data, error } = await supabase
      .from("wishlist")
      .upsert(
        {
          user_id: user.id,
          product_id: productId,
        },
        {
          onConflict: "user_id,product_id",
          ignoreDuplicates: true,
        },
      )
      .select()
      .single();

    if (error && error.code !== "23505") {
      // 23505 is duplicate key error, which we ignore
      console.error("Error adding to wishlist:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Added to wishlist",
      item: data,
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
