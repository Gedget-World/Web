import { Button } from "@/components/ui/button";
import { CopyPlus } from "lucide-react";
import DataTable from "./data-table";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage() {
  const supabase = await createClient();
  return (
    <div className="m-5">
      <header className="p-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button size="sm">
          <CopyPlus /> Add Product
        </Button>
      </header>
      <main>
        {/* Product list will go here */}
        <DataTable supabase={supabase} />
      </main>
    </div>
  );
}
