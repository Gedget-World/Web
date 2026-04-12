"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Share2,
  Copy,
  Facebook,
  Twitter,
  Check,
  MessageCircle,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useWishlist, useWishlistStore } from "@/hooks/use-wishlist";

interface ProductActionsProps {
  productId: string;
  productName: string;
  productSlug: string;
}

export function ProductActions({
  productId,
  productName,
  productSlug,
}: ProductActionsProps) {
  const { toggleItem } = useWishlist();
  const { isInWishlist, isHydrated } = useWishlistStore();
  const [isToggling, setIsToggling] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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

  const productUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/products/${productSlug}`
      : `/products/${productSlug}`;

  const handleWishlist = async () => {
    if (isToggling) return;

    setIsToggling(true);
    const wasWishlisted = isWishlisted;
    // Optimistic update
    setIsWishlisted(!isWishlisted);

    try {
      await toggleItem(productId);
      toast({
        title: wasWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
        description: wasWishlisted
          ? `${productName} has been removed from your wishlist`
          : `${productName} has been added to your wishlist`,
      });
    } catch (error) {
      // Revert on error
      setIsWishlisted(wasWishlisted);
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Product link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(productUrl);
    const encodedText = encodeURIComponent(`Check out ${productName}!`);

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Wishlist Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleWishlist}
        disabled={isToggling}
        className={`h-9 w-9 rounded-full transition-all ${
          isWishlisted
            ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
            : "hover:bg-gray-100"
        }`}
      >
        {isToggling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
        )}
      </Button>

      {/* Share Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-gray-100"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
            {copied ? (
              <Check className="h-4 w-4 mr-2 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleShare("whatsapp")}
            className="cursor-pointer"
          >
            <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleShare("facebook")}
            className="cursor-pointer"
          >
            <Facebook className="h-4 w-4 mr-2 text-blue-600" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleShare("twitter")}
            className="cursor-pointer"
          >
            <Twitter className="h-4 w-4 mr-2 text-sky-500" />
            Twitter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
