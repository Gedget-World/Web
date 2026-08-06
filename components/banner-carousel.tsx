"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BannerCard, type BannerItem } from "@/components/banner-list";

type PlacementCarousel = {
  id: string;
  name: string;
  auto_play: boolean;
  interval_ms: number;
  show_arrows: boolean;
  show_dots: boolean;
  infinite_loop: boolean;
  pause_on_hover: boolean;
  banners: BannerItem[];
};

export function BannerCarousel({
  carousel,
  priority = false,
}: {
  carousel: PlacementCarousel;
  priority?: boolean;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const autoplayPlugin = useMemo(() => {
    if (!carousel.auto_play) {
      return null;
    }

    return Autoplay({
      delay: carousel.interval_ms || 5000,
      stopOnInteraction: true,
      stopOnMouseEnter: carousel.pause_on_hover,
    });
  }, [carousel.auto_play, carousel.interval_ms, carousel.pause_on_hover]);

  useEffect(() => {
    if (!api || !carousel.banners.length) {
      return;
    }

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    handleSelect();
    api.on("select", handleSelect);

    return () => {
      api.off("select", handleSelect);
    };
  }, [api, carousel.banners.length]);

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api],
  );

  const canLoop = carousel.infinite_loop && carousel.banners.length > 1;

  return (
    <section className="py-8">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-md">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: canLoop,
            }}
            plugins={
              autoplayPlugin
                ? ([autoplayPlugin] as unknown as Parameters<
                    typeof Carousel
                  >[0]["plugins"])
                : undefined
            }
            className="w-full"
          >
            <CarouselContent className="m-0">
              {carousel.banners.map((banner, index) => (
                <CarouselItem key={banner.id} className="p-0">
                  <BannerCard
                    banner={banner}
                    priority={priority && index === 0}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {carousel.show_arrows && carousel.banners.length > 1 && (
            <>
              <button
                onClick={() => api?.scrollPrev()}
                className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/60 md:flex"
                aria-label="Previous banner"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => api?.scrollNext()}
                className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/60 md:flex"
                aria-label="Next banner"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {carousel.show_dots && carousel.banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/30 px-2 backdrop-blur-sm">
              {carousel.banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className="group flex h-6 w-6 items-center justify-center"
                  aria-label={`Go to banner ${index + 1}`}
                >
                  <span
                    className={`h-2 rounded-full transition-all ${
                      current === index
                        ? "w-6 bg-white"
                        : "w-2 bg-white/60 group-hover:bg-white/80"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export type { PlacementCarousel };
