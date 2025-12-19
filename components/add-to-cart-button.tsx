"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, ShoppingCart } from "lucide-react";
import { useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
};

export function AddToCartButton({
  product,
  disabled,
}: {
  product: Product;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { addItem, items, updateQuantity } = useCart();
  const [added, setAdded] = useState(false);

  // Find if this product is in the cart
  const cartItem = items.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  const handleAddToCart = () => {
    addItem(product);
    setAdded(true);

    // Confetti celebration effect
    createConfetti();

    setTimeout(() => setAdded(false), 1000);
  };

  const handleBuyNow = () => {
    if (quantity === 0) {
      // Confetti celebration effect
      createConfetti();
      addItem(product);
    }
    router.push("/cart");
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

      const duration = Math.random() * 2 + 2.5;
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 5 + 5;
      let x = parseFloat(confetti.style.left);
      let y = 0;
      let vx = Math.cos(angle) * velocity;
      let vy = -Math.sin(angle) * velocity;
      let gravity = 0.1;

      const animate = () => {
        x += vx;
        y += vy;
        vy += gravity;
        confetti.style.left = x + "px";
        confetti.style.top = y + "px";
        const opacity = Math.max(
          0,
          Math.min(1, 1 - y / (window.innerHeight * 1.5))
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

  const handleIncrement = () => {
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          {quantity === 0 ? (
            // Show Add to Cart button when product is not in cart
            <Button
              onClick={handleAddToCart}
              disabled={disabled || added}
              size="lg"
              className="w-full bg-amber-400 text-black hover:bg-amber-500 cursor-pointer text-sm sm:text-base"
            >
              <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {added ? "Added!" : "Add to Cart"}
            </Button>
          ) : (
            // Show quantity controls when product is in cart
            <div className="flex items-center justify-center mt-1 gap-1 sm:gap-2 mb-2 flex-wrap">
              <span className="text-xs sm:text-sm">Qty:</span>
              <Button
                onClick={handleDecrement}
                variant="outline"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 bg-transparent"
              >
                <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">
                {quantity}
              </span>
              <Button
                onClick={handleIncrement}
                variant="outline"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 bg-transparent"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          )}
        </div>
        <div>
          <Button
            onClick={handleBuyNow}
            disabled={disabled}
            size="lg"
            className="w-full cursor-pointer text-sm sm:text-base"
          >
            <ShoppingBag className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Buy Now
          </Button>
        </div>
      </div>
    </>
  );
}
