import { createClient } from "@/lib/supabase/server";
import { BestsellersClient } from "@/components/bestsellers-client";

export const metadata = {
  title: "Bestsellers | StyleHub",
  description: "Shop our most popular and top-selling fashion items",
};

export default async function BestsellersPage() {
  const supabase = await createClient();

  // Fetch bestselling products (sorted by sales count)
  const { data: products } = await supabase
    .from("products")
    .select(
      `
      *,
      collections (
        id,
        name,
        slug,
        parent_id,
        parent:parent_id(name, slug)
      )
    `,
    )
    .gt("sales_count", 0)
    .order("sales_count", { ascending: false });

  // Fetch all collections for filters
  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, slug, parent_id, parent:parent_id(name, slug)")
    .order("name");

  return (
    <BestsellersClient
      initialProducts={products || []}
      collections={collections || []}
    />
  );
}
