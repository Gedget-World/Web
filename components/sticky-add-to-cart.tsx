"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

interface StickyAddToCartProps {
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    stock: number;
  };
  disabled?: boolean;
}

export function StickyAddToCart({ product, disabled }: StickyAddToCartProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addItem, items } = useCart();

  const cartItem = items.find((item) => item.id === product.id);
  const currentQuantity = cartItem?.quantity ?? 0;
  const maxQuantity = product.stock - currentQuantity;

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar after scrolling past 500px
      const shouldShow = window.scrollY > 500;
      setIsVisible(shouldShow);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({ ...product, stock: product.stock });
    }
    setQuantity(1);
  };

  if (disabled || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 md:hidden">
      <div className="flex items-center justify-between p-3 gap-3">
        {/* Price */}
        <div className="shrink-0">
          <p className="text-lg font-bold text-slate-900">
            ₹{Math.round(product.price).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center text-sm font-medium">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
            disabled={quantity >= maxQuantity}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={maxQuantity <= 0}
          className="flex-1 max-w-[160px]"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {maxQuantity <= 0 ? "Max in Cart" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
