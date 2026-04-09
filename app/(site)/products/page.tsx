import { Suspense } from "react";
import { ProductsClient } from "@/components/products-client";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Products",
  description: "Browse our complete collection of products",
};

function ProductsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsClient />
    </Suspense>
  );
}
