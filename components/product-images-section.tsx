"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import type { CarouselApi } from "@/components/ui/carousel";

interface ProductImage {
  id: string;
  image_url: string;
  image_name: string;
  display_order: number | null;
}

interface ProductImagesSectionProps {
  productId: number;
  thumbnailUrl?: string | null; // Cached thumbnail from product listing
}

export default function ProductImagesSection({
  productId,
  thumbnailUrl,
}: ProductImagesSectionProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [showGallery, setShowGallery] = useState(false);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", productId)
          .order("display_order", { ascending: true });

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          setImages(data as ProductImage[]);
          setSelectedIndex(0);
          // Small delay before showing gallery for smooth transition
          setTimeout(() => setShowGallery(true), 100);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load images");
        console.error("Error fetching product images:", err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchImages();
    }
  }, [productId]);

  const handleThumbnailHover = (index: number) => {
    setSelectedIndex(index);
    carouselApi?.scrollTo(index);
  };

  const startScrolling = (direction: "up" | "down") => {
    if (scrollIntervalRef.current) return;
    scrollIntervalRef.current = setInterval(() => {
      if (thumbnailContainerRef.current) {
        thumbnailContainerRef.current.scrollBy({
          top: direction === "up" ? -30 : 30,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  // Show thumbnail while loading or on error
  if (loading || error || images.length === 0) {
    return (
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt="Product"
                fill
                className="object-contain"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Thumbnail Gallery - Hidden on Mobile */}
      <div
        className={`hidden md:flex flex-col items-center gap-1 transition-opacity duration-500 ${
          showGallery ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Scroll Up Zone */}
        <div
          className="w-[70px] h-6 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded transition-colors"
          onMouseEnter={() => startScrolling("up")}
          onMouseLeave={stopScrolling}
        >
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </div>

        {/* Thumbnails Container */}
        <div
          ref={thumbnailContainerRef}
          className="w-[70px] flex flex-col gap-2 max-h-[400px] overflow-y-auto scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              onMouseEnter={() => handleThumbnailHover(index)}
              className={`relative w-full aspect-square cursor-pointer rounded-md overflow-hidden border-2 transition-all shrink-0 ${
                selectedIndex === index
                  ? "border-blue-500 scale-105"
                  : "border-gray-200 hover:border-gray-400 hover:scale-100"
              }`}
            >
              <Image
                src={image.image_url}
                alt={image.image_name}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {/* Scroll Down Zone */}
        <div
          className="w-[70px] h-6 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded transition-colors"
          onMouseEnter={() => startScrolling("down")}
          onMouseLeave={stopScrolling}
        >
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Main Image Display - Carousel */}
      <div className="flex-1 relative">
        {/* Thumbnail overlay that fades out */}
        {thumbnailUrl && (
          <div
            className={`absolute inset-0 z-10 bg-gray-100 rounded-lg overflow-hidden transition-opacity duration-500 pointer-events-none ${
              showGallery ? "opacity-0" : "opacity-100"
            }`}
          >
            <Image
              src={thumbnailUrl}
              alt="Product"
              fill
              className="object-contain"
              priority
            />
          </div>
        )}

        {images.length > 0 && (
          <Carousel className="w-full" setApi={setCarouselApi}>
            <CarouselContent>
              {images.map((image) => (
                <CarouselItem key={image.id}>
                  <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={image.image_url}
                      alt={image.image_name}
                      width={800}
                      height={800}
                      className="w-full h-auto object-contain"
                      priority
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        )}
      </div>
    </div>
  );
}
