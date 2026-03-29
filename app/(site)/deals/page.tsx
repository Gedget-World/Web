import { createClient } from "@/lib/supabase/server";
import { DealsClient } from "@/components/deals-client";

export const metadata = {
  title: "Deals & Offers | StyleHub",
  description: "Shop the best deals and special offers on fashion items",
};

export default async function DealsPage() {
  const supabase = await createClient();

  // Fetch products with discounts
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
    .gt("discount_percentage", 0)
    .order("discount_percentage", { ascending: false });

  // Fetch all collections for filters
  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, slug, parent_id, parent:parent_id(name, slug)")
    .order("name");

  return (
    <DealsClient
      initialProducts={products || []}
      collections={collections || []}
    />
  );
}
