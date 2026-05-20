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
  const [added, setAdded] = useState(false);
  const { addItem, items, updateQuantity } = useCart();

  const cartItem = items.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

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
    const success = addItem({ ...product, stock: product.stock });
    if (!success) {
      return;
    }
    setAdded(true);
    createConfetti();

    setTimeout(() => setAdded(false), 1000);
  };

  const handleIncrement = () => {
    updateQuantity(product.id, quantity + 1, product.stock);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  const createConfetti = () => {
    const confettiCount = 50;
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement("div");
      confetti.style.position = "fixed";
      confetti.style.left = Math.random() * window.innerWidth + "px";
      confetti.style.top = "-10px";
      confetti.style.width = "10px";
      confetti.style.height = "10px";
      confetti.style.backgroundColor = [
        "#FFD700",
        "#FFA500",
        "#FF6347",
        "#32CD32",
        "#4169E1",
      ][Math.floor(Math.random() * 5)];
      confetti.style.borderRadius = "50%";
      confetti.style.pointerEvents = "none";
      confetti.style.zIndex = "9999";
      document.body.appendChild(confetti);

      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 5 + 5;
      let x = parseFloat(confetti.style.left);
      let y = 0;
      const vx = Math.cos(angle) * velocity;
      let vy = -Math.sin(angle) * velocity;
      const gravity = 0.1;

      const animate = () => {
        x += vx;
        y += vy;
        vy += gravity;
        confetti.style.left = x + "px";
        confetti.style.top = y + "px";
        const opacity = Math.max(
          0,
          Math.min(1, 1 - y / (window.innerHeight * 1.5)),
        );
        confetti.style.opacity = opacity.toString();

        if (y < window.innerHeight) {
          requestAnimationFrame(animate);
        } else {
          confetti.remove();
        }
      };
      animate();
    }
  };

  if (disabled || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 md:hidden">
      <div className="flex items-center justify-between p-3 gap-3">
        <div className="shrink-0">
          <p className="text-lg font-bold text-slate-900">
            ₹{Math.round(product.price).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {quantity === 0 ? (
            <Button
              onClick={handleAddToCart}
              disabled={disabled || added || product.stock <= 0}
              className="flex-1 max-w-[180px] bg-amber-400 text-black hover:bg-amber-500"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {added ? "Added!" : "Add to Cart"}
            </Button>
          ) : (
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <Button
                onClick={handleDecrement}
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-transparent"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">
                {quantity}
              </span>
              <Button
                onClick={handleIncrement}
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-transparent"
                disabled={quantity >= product.stock}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
      {quantity >= product.stock && quantity > 0 && (
        <div className="px-3 pb-3 text-right text-sm font-medium text-amber-600">
          Max {product.stock} items available
        </div>
      )}
    </div>
  );
}
