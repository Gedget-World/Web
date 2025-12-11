import { createClient } from "@/lib/supabase/server";
import { CollectionsClient } from "@/components/collections-client";

export default async function CollectionsPage() {
  const supabase = await createClient();

  const { data: collections } = await supabase.from("collections").select(`
    *,
    products_count:products!products_collection_id_fkey(count)
  `);

  return <CollectionsClient collections={collections || []} />;
}
