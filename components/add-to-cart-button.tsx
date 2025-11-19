"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { ShoppingCart } from "lucide-react";
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
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={disabled || added}
      size="lg"
      className="w-full"
    >
      <ShoppingCart className="mr-2 h-5 w-5" />
      {added ? "Added to Cart!" : "Add to Cart"}
    </Button>
  );
}
