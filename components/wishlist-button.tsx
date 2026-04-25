"use client";

import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist, useWishlistStore } from "@/hooks/use-wishlist";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  variant?: "icon" | "default" | "outline";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export function WishlistButton({
  productId,
  variant = "icon",
  size = "icon",
  className,
  showText = false,
}: WishlistButtonProps) {
  const { toggleItem } = useWishlist();
  const { isInWishlist, isHydrated } = useWishlistStore();
  const [isToggling, setIsToggling] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Sync with store after hydration
  useEffect(() => {
    if (isHydrated) {
      setIsWishlisted(isInWishlist(productId));
    }
  }, [isHydrated, isInWishlist, productId]);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = useWishlistStore.subscribe((state) => {
      setIsWishlisted(state.isInWishlist(productId));
    });
    return unsubscribe;
  }, [productId]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isToggling) return;

    setIsToggling(true);
    // Optimistic update
    setIsWishlisted(!isWishlisted);

    try {
      await toggleItem(productId);
    } catch (error) {
      // Revert on error
      setIsWishlisted(isWishlisted);
      console.error("Failed to toggle wishlist:", error);
    } finally {
      setIsToggling(false);
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={handleToggle}
        disabled={isToggling}
        className={cn(
          "h-8 w-8 rounded-full bg-white/80 hover:bg-white transition-all",
          isWishlisted ? "text-red-500" : "text-gray-600",
          className,
        )}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        {isToggling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart
            className={cn(
              "h-4 w-4 transition-all duration-200",
              isWishlisted && "fill-current scale-110",
            )}
          />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={variant === "outline" ? "outline" : "default"}
      size={size}
      onClick={handleToggle}
      disabled={isToggling}
      className={cn(
        "transition-all",
        isWishlisted && variant !== "outline"
          ? "bg-red-500 hover:bg-red-600 text-white"
          : isWishlisted && variant === "outline"
            ? "border-red-500 text-red-500 hover:bg-red-50"
            : "",
        className,
      )}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      {isToggling ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <Heart
          className={cn(
            "h-4 w-4 transition-all duration-200",
            showText && "mr-2",
            isWishlisted && "fill-current",
          )}
        />
      )}
      {showText && (isWishlisted ? "Wishlisted" : "Add to Wishlist")}
    </Button>
  );
}
