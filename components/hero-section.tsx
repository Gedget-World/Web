"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Link from "next/link";

const BANNER_IMAGES = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=400&fit=crop",
    alt: "Banner 1",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=400&fit=crop",
    alt: "Banner 2",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&h=400&fit=crop",
    alt: "Banner 3",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&h=400&fit=crop",
    alt: "Banner 4",
  },
];

export function HeroSection() {
  const plugin = React.useMemo(
    () => Autoplay({ delay: 5000, stopOnInteraction: true }),
    [],
  );

  return (
    <section className="relative w-full overflow-hidden mb-6">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[plugin]}
        className="w-full h-[300px] md:h-[300px] lg:h-[400px]"
      >
        <CarouselContent className="m-0">
          {BANNER_IMAGES.map((banner) => (
            <CarouselItem key={banner.id} className="p-0">
              <div className="relative w-full h-[300px] md:h-[300px] lg:h-[400px]">
                <img
                  src={banner.src}
                  alt={banner.alt}
                  className="w-full h-full object-cover"
                />
                {/* Optional overlay for better text readability */}
                <div className="absolute inset-0 bg-black/20" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation controls */}
        {/* <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" /> */}

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {BANNER_IMAGES.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full bg-white/50 transition-all duration-300 hover:bg-white/80"
            />
          ))}
        </div>
      </Carousel>
    </section>
  );
}
