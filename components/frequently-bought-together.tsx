"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { Plus, ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Skeleton } from "./ui/skeleton";

interface FrequentlyBoughtTogetherProps {
  productId: string;
  currentProduct: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    stock: number;
  };
}

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  stock: number;
  discount_percentage: number | null;
};

export function FrequentlyBoughtTogether({
  productId,
  currentProduct,
}: FrequentlyBoughtTogetherProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      setLoading(true);
      const supabase = createClient();

      // For now, fetch random active products (in a real app, this would be based on order history)
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .neq("id", productId)
        .gt("stock", 0)
        .limit(3);

      if (!error && data) {
        setProducts(data);
        // Pre-select all products
        setSelectedIds(new Set(data.map((p) => p.id)));
      }
      setLoading(false);
    };

    fetchRelatedProducts();
  }, [productId]);

  const toggleProduct = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const totalPrice =
    currentProduct.price +
    products
      .filter((p) => selectedIds.has(p.id))
      .reduce((sum, p) => sum + p.price, 0);

  const handleAddAll = () => {
    // Add current product
    addItem({ ...currentProduct, stock: currentProduct.stock });

    // Add selected products
    products
      .filter((p) => selectedIds.has(p.id))
      .forEach((p) => {
        addItem({
          id: p.id,
          name: p.name,
          price: p.price,
          image_url: p.image_url,
          stock: p.stock,
        });
      });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <section className="mt-12 pt-8 border-t">
        <h2 className="text-lg font-semibold mb-4">
          Frequently Bought Together
        </h2>
        <div className="flex items-center gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-lg" />
              {i < 2 && <Plus className="h-4 w-4 text-gray-300" />}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 pt-8 border-t">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Frequently Bought Together
      </h2>

      <div className="bg-slate-50 rounded-xl p-4 md:p-6">
        {/* Products Row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Current Product */}
          <div className="flex flex-col items-center">
            <div className="relative h-20 w-20 md:h-24 md:w-24 bg-white rounded-lg border-2 border-primary overflow-hidden">
              <Image
                src={currentProduct.image_url || "/placeholder.svg"}
                alt={currentProduct.name}
                fill
                className="object-contain p-2"
              />
              <div className="absolute -top-1 -right-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                This
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-1 text-center line-clamp-1 max-w-[80px]">
              {currentProduct.name}
            </p>
          </div>

          {products.map((product, index) => (
            <div key={product.id} className="flex items-center gap-3">
              <Plus className="h-4 w-4 text-slate-400 shrink-0" />
              <button
                onClick={() => toggleProduct(product.id)}
                className="flex flex-col items-center group"
              >
                <div
                  className={`relative h-20 w-20 md:h-24 md:w-24 bg-white rounded-lg border-2 overflow-hidden transition-all ${
                    selectedIds.has(product.id)
                      ? "border-green-500 ring-2 ring-green-100"
                      : "border-gray-200 opacity-50"
                  }`}
                >
                  <Image
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-contain p-2"
                  />
                  {selectedIds.has(product.id) && (
                    <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 text-center line-clamp-1 max-w-[80px]">
                  {product.name}
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  ₹{product.price.toLocaleString("en-IN")}
                </p>
              </button>
            </div>
          ))}
        </div>

        {/* Total and Add Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-slate-200">
          <div>
            <p className="text-sm text-slate-600">
              Total for {selectedIds.size + 1} items:
            </p>
            <p className="text-xl font-bold text-slate-900">
              ₹{Math.round(totalPrice).toLocaleString("en-IN")}
            </p>
          </div>
          <Button
            onClick={handleAddAll}
            disabled={added}
            className={`transition-all ${
              added ? "bg-green-600 hover:bg-green-600" : ""
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Added to Cart!
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add All to Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
