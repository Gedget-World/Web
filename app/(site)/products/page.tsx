import { createClient } from "@/lib/supabase/server";
import { ProductsClient } from "@/components/products-client";

export default async function ProductsPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*, collections(name, slug)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, slug")
    .order("name");

  const productsWithRatings = products?.map((product) => {
    const reviews = product.reviews as { rating: number }[];
    const reviewCount = reviews?.length || 0;
    const averageRating =
      reviewCount > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
        : 0;

    return {
      ...product,
      average_rating: averageRating,
      review_count: reviewCount,
    };
  });

  return (
    <ProductsClient
      initialProducts={productsWithRatings || []}
      collections={collections || []}
    />
  );
}
