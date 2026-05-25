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

type BannerItem = {
  id: string;
  title: string;
  subtitle: string | null;
  desktop_image_url: string;
  desktop_width: number | null;
  desktop_height: number | null;
  tablet_image_url: string | null;
  mobile_image_url: string | null;
  link_url: string | null;
  link_target: string | null;
  link_text: string | null;
  text_color: string | null;
  overlay_color: string | null;
  text_position: string | null;
  alt_text: string | null;
};

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

type BannersResponse = {
  success: boolean;
  data?: BannerItem[];
};

type CarouselResponse = {
  success: boolean;
  data: PlacementCarousel | null;
};

function textPositionClass(position: string | null) {
  switch (position) {
    case "left":
      return "items-center justify-start text-left";
    case "right":
      return "items-center justify-end text-right";
    default:
      return "items-center justify-center text-center";
  }
}

function BannerCard({ banner }: { banner: BannerItem }) {
  const linkUrl = banner.link_url?.trim();
  const hasLink = Boolean(linkUrl);

  return (
    <div className="group relative overflow-hidden rounded-2xl">
      {hasLink ? (
        <a
          href={linkUrl}
          target={banner.link_target ?? "_self"}
          rel={
            banner.link_target === "_blank" ? "noopener noreferrer" : undefined
          }
          className="block"
        >
          <picture>
            {banner.mobile_image_url && (
              <source
                media="(max-width: 767px)"
                srcSet={banner.mobile_image_url}
              />
            )}
            {banner.tablet_image_url && (
              <source
                media="(max-width: 1023px)"
                srcSet={banner.tablet_image_url}
              />
            )}
            <img
              src={banner.desktop_image_url}
              alt={banner.alt_text || banner.title}
              loading="lazy"
              className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              style={{
                aspectRatio:
                  banner.desktop_width && banner.desktop_height
                    ? `${banner.desktop_width} / ${banner.desktop_height}`
                    : undefined,
              }}
            />
          </picture>
        </a>
      ) : (
        <picture>
          {banner.mobile_image_url && (
            <source
              media="(max-width: 767px)"
              srcSet={banner.mobile_image_url}
            />
          )}
          {banner.tablet_image_url && (
            <source
              media="(max-width: 1023px)"
              srcSet={banner.tablet_image_url}
            />
          )}
          <img
            src={banner.desktop_image_url}
            alt={banner.alt_text || banner.title}
            loading="lazy"
            className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            style={{
              aspectRatio:
                banner.desktop_width && banner.desktop_height
                  ? `${banner.desktop_width} / ${banner.desktop_height}`
                  : undefined,
            }}
          />
        </picture>
      )}

      {(banner.overlay_color ||
        banner.title ||
        banner.subtitle ||
        banner.link_text) && (
        <div
          className={`absolute inset-0 flex p-6 md:p-10 ${textPositionClass(banner.text_position)}`}
          style={{ backgroundColor: banner.overlay_color || "transparent" }}
        >
          {(banner.title || banner.subtitle || banner.link_text) && (
            <div
              className="max-w-2xl space-y-2"
              style={{ color: banner.text_color || "#ffffff" }}
            >
              {banner.title && (
                <h3 className="text-xl font-bold md:text-3xl">
                  {banner.title}
                </h3>
              )}
              {banner.subtitle && (
                <p className="text-sm opacity-95 md:text-base">
                  {banner.subtitle}
                </p>
              )}
              {banner.link_text && (
                <span className="mt-2 inline-flex rounded-full bg-black/35 px-4 py-1.5 text-sm font-medium">
                  {banner.link_text}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Banners({ placementName }: { placementName: string }) {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [carousel, setCarousel] = useState<PlacementCarousel | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  const autoplayPlugin = useMemo(() => {
    if (!carousel?.auto_play) {
      return null;
    }

    return Autoplay({
      delay: carousel.interval_ms || 5000,
      stopOnInteraction: true,
      stopOnMouseEnter: carousel.pause_on_hover,
    });
  }, [carousel]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [carouselRes, bannersRes] = await Promise.all([
          fetch(
            `/api/content/carousels/placement?placementName=${encodeURIComponent(placementName)}`,
            { cache: "no-store" },
          ),
          fetch(
            `/api/content/banners/placement?placementName=${encodeURIComponent(placementName)}`,
            { cache: "no-store" },
          ),
        ]);

        const [carouselJson, bannersJson]: [CarouselResponse, BannersResponse] =
          await Promise.all([carouselRes.json(), bannersRes.json()]);

        if (isMounted) {
          const hasCarouselBanners = Boolean(
            carouselJson.data?.banners?.length,
          );

          setCarousel(hasCarouselBanners ? carouselJson.data : null);
          setBanners(
            hasCarouselBanners
              ? []
              : bannersJson.success
                ? (bannersJson.data ?? [])
                : [],
          );
          setCurrent(0);
        }
      } catch (error) {
        console.error("Failed to load placement banners:", error);
        if (isMounted) {
          setCarousel(null);
          setBanners([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [placementName]);

  useEffect(() => {
    if (!api || !carousel?.banners?.length) {
      return;
    }

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api, carousel?.banners.length]);

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api],
  );

  if (loading || (banners.length === 0 && !carousel?.banners?.length)) {
    return null;
  }

  if (carousel?.banners?.length) {
    const canLoop = carousel.infinite_loop && carousel.banners.length > 1;

    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl">
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
                {carousel.banners.map((banner) => (
                  <CarouselItem key={banner.id} className="p-0">
                    <BannerCard banner={banner} />
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
              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-black/30 px-3 py-2 backdrop-blur-sm">
                {carousel.banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={`h-2 rounded-full transition-all ${
                      current === index
                        ? "w-6 bg-white"
                        : "w-2 bg-white/60 hover:bg-white/80"
                    }`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="space-y-4">
          {banners.map((banner) => (
            <BannerCard key={banner.id} banner={banner} />
          ))}
        </div>
      </div>
    </section>
  );
}
