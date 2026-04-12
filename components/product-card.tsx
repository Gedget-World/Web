"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, Eye, Check, Sparkles, Zap } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";
import { Spinner } from "./ui/spinner";
import { WishlistButton } from "@/components/wishlist-button";

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
  is_new_arrival?: boolean;
  is_featured?: boolean;
};

export function ProductCard({ product }: { product: Product }) {
  const { addItem, getItemQuantity } = useCart();
  const [added, setAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const cartQuantity = getItemQuantity(product.id);

  // Check both is_out_of_stock flag and stock quantity
  const isOutOfStock = product.is_out_of_stock || product.stock <= 0;
  const isAtMaxStock = cartQuantity >= product.stock;
  const hasDiscount =
    product.discount_percentage && product.discount_percentage > 0;
  const originalPrice = hasDiscount
    ? Math.round(product.price / (1 - product.discount_percentage! / 100))
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAtMaxStock) return;

    const success = addItem({ ...product, stock: product.stock });
    if (!success) {
      return;
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Card className="group overflow-hidden p-0 border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 bg-white rounded-xl">
      <Link href={`/products/${product.slug}`}>
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {/* Skeleton loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse" />
          )}
          <Image
            src={product.image_url || "/placeholder.svg?height=400&width=400"}
            alt={product.name}
            fill
            className={`object-contain group-hover:scale-105 transition-transform duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Badges Container */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {isOutOfStock && (
              <Badge className="bg-slate-900 text-white text-[10px] px-2 py-0.5 font-semibold uppercase">
                Sold Out
              </Badge>
            )}
            {hasDiscount && !isOutOfStock && (
              <Badge className="bg-red-500 text-white text-[10px] px-2 py-0.5 font-bold">
                -{product.discount_percentage}%
              </Badge>
            )}
            {product.is_new_arrival && (
              <Badge className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 font-semibold uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                New
              </Badge>
            )}
            {product.is_featured && !product.is_new_arrival && (
              <Badge className="bg-amber-500 text-white text-[10px] px-2 py-0.5 font-semibold uppercase flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Hot
              </Badge>
            )}
          </div>

          {/* Quick Actions - Wishlist */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <WishlistButton productId={product.id} />
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-3 pb-1">
          {/* Product Name */}
          <h3 className="font-medium text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {product.average_rating !== undefined &&
            product.review_count !== undefined &&
            product.review_count > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded">
                  <span className="text-xs font-semibold text-green-700">
                    {product.average_rating.toFixed(1)}
                  </span>
                  <Star className="h-3 w-3 fill-green-600 text-green-600" />
                </div>
                <span className="text-xs text-gray-500">
                  ({product.review_count}{" "}
                  {product.review_count === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}
        </CardContent>

        {/* Footer */}
        <CardFooter className="p-3 pt-1 flex items-center justify-between gap-2">
          {/* Price */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-gray-900">
                ₹{Math.floor(product.price).toLocaleString("en-IN")}
              </span>
              {originalPrice && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            {hasDiscount && (
              <span className="text-[10px] text-green-600 font-medium">
                Save ₹{(originalPrice! - product.price).toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <Button
            variant={added ? "default" : "outline"}
            size="sm"
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAtMaxStock}
            className={`shrink-0 transition-all duration-300 ${
              added
                ? "bg-green-600 hover:bg-green-600 text-white border-green-600"
                : isOutOfStock
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-primary hover:text-white hover:border-primary"
            }`}
          >
            {added ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
