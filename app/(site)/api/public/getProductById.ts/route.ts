import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// API KEY CHECK
// CHECK IS THE COLLECTION PARAM IS PRESENT
// CHECK THE COLLECTION PARAM IS VALID
// CHECK THE COLLECTION IS SHAREABLE
// FETCH THE PRODUCTS FROM THE DATABASE BASED ON THE COLLECTION
// RETURN THE PRODUCTS AS JSON RESPONSE

export async function GET(request: NextRequest) {
  // Hardcoded collection ID for now - MIC-Store
  // const collectionId = "ad987571-6381-4247-9d31-af1e74697c4b";
  const collectionId = "300dfea6-c096-4b5d-a1fc-b7434e6dc353"; // Test

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, description, image_url, price, discount_percentage, is_active",
    )
    .eq("collection_id", collectionId);

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    products: data,
  });
}
