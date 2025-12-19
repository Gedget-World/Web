"use client";

import { useEffect, useState } from "react";
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

export default function ProductImagesSection({
  productId,
}: {
  productId: number;
}) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

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

  if (loading) {
    return <div className="flex gap-4">Loading images...</div>;
  }

  if (error) {
    return <div className="flex gap-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex gap-4">
      {/* Thumbnail Gallery - Hidden on Mobile */}
      <div className="hidden md:flex w-[70px] flex-col gap-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            onMouseEnter={() => handleThumbnailHover(index)}
            className={`relative w-full aspect-square cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
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

      {/* Main Image Display - Carousel */}
      <div className="flex-1">
        {images.length > 0 && (
          <Carousel className="w-full" setApi={setCarouselApi}>
            <CarouselContent>
              {images.map((image) => (
                <CarouselItem key={image.id}>
                  <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={image.image_url}
                      alt={image.image_name}
                      fill
                      className="object-cover"
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
