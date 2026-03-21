"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { Spinner } from "./ui/spinner";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  discount_percentage: number | null;
  average_rating?: number;
  review_count?: number;
  is_out_of_stock: boolean;
};

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  // Check both is_out_of_stock flag and stock quantity
  const isOutOfStock = product.is_out_of_stock || product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1000);
  };

  return (
    <Card className="group overflow-hidden p-0 border-none shadow-none">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden rounded-xl">
          <Image
            src={product.image_url || "/placeholder.svg?height=400&width=400"}
            alt={product.name}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300"
          />
          {isOutOfStock && (
            <div className="absolute top-4 left-2 bg-black opacity-70 text-white font-semibold text-xs px-3 py-2 rounded-full">
              Out of Stock
            </div>
          )}
        </div>
        <CardContent className="p-0">
          <h3 className="font-medium px-1 mt-2 mb-1 text-sm text-slate-900 line-clamp-2">
            {product.name}
          </h3>
          {product.average_rating !== undefined &&
            product.review_count !== undefined &&
            product.review_count > 0 && (
              <div className="flex items-center gap-2 px-1">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= Math.round(product.average_rating!)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-600">
                  {product.average_rating.toFixed(1)} ({product.review_count})
                </span>
              </div>
            )}
        </CardContent>
        <CardFooter className="p-1 pt-0 flex items-center justify-between">
          <div className="flex items-center align-middle">
            <span className="text-sm font-regular text-slate-900">
              &#8377;{Math.floor(product.price)}{" "}
              {product.discount_percentage &&
                product.discount_percentage > 0 && (
                  <span className="line-through text-slate-500 text-xs">
                    &#8377;
                    {Math.round(
                      product.price / (1 - product.discount_percentage / 100),
                    )}
                  </span>
                )}
            </span>
            {product.discount_percentage && product.discount_percentage > 0 && (
              <div className="text-[10px] bg-green-600 text-white inline-block py-0 px-1 border border-green-600 rounded-md ml-1">
                {product.discount_percentage
                  ? `${product.discount_percentage} %`
                  : ""}
              </div>
            )}
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToCart}
              disabled={isOutOfStock || added}
            >
              {added ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <ShoppingCart className="h-5 w-5" />
              )}
            </Button>
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}
