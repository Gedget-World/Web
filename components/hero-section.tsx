"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

const BANNER_SLIDES = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=400&fit=crop",
    alt: "Premium Headphones",
    badge: "New Arrival",
    badgeColor: "bg-emerald-500",
    title: "Premium Audio Experience",
    subtitle: "Discover our latest collection of wireless headphones",
    cta: "Shop Headphones",
    link: "/collections/headphones",
    gradient: "from-violet-900/90 via-violet-800/70 to-transparent",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=400&fit=crop",
    alt: "Smart Watches",
    badge: "Up to 40% Off",
    badgeColor: "bg-red-500",
    title: "Smart Living Starts Here",
    subtitle: "Track your fitness goals with cutting-edge smartwatches",
    cta: "Explore Watches",
    link: "/collections/watches",
    gradient: "from-blue-900/90 via-blue-800/70 to-transparent",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1200&h=400&fit=crop",
    alt: "Tech Accessories",
    badge: "Best Seller",
    badgeColor: "bg-amber-500",
    title: "Accessories That Define You",
    subtitle: "Complete your setup with premium tech accessories",
    cta: "View Collection",
    link: "/collections/accessories",
    gradient: "from-orange-900/90 via-orange-800/70 to-transparent",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1200&h=400&fit=crop",
    alt: "Summer Sale",
    badge: "Limited Time",
    badgeColor: "bg-pink-500",
    title: "Summer Sale is Live!",
    subtitle: "Get up to 50% off on selected premium gadgets",
    cta: "Shop the Sale",
    link: "/deals",
    gradient: "from-pink-900/90 via-pink-800/70 to-transparent",
  },
];

export function HeroSection() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  const plugin = React.useMemo(
    () => Autoplay({ delay: 5000, stopOnInteraction: true }),
    [],
  );

  React.useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollTo = React.useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api],
  );

  return (
    <section className="relative w-full overflow-hidden mb-8">
      {/* Main Hero Carousel */}
      <div className="relative">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={
            [plugin] as unknown as Parameters<typeof Carousel>[0]["plugins"]
          }
          className="w-full"
        >
          <CarouselContent className="m-0">
            {BANNER_SLIDES.map((slide) => (
              <CarouselItem key={slide.id} className="p-0">
                <div className="relative w-full h-[400px] md:h-[450px] lg:h-[500px]">
                  {/* Background Image */}
                  <img
                    src={slide.src}
                    alt={slide.alt}
                    className="w-full h-full object-cover"
                  />

                  {/* Gradient Overlay */}
                  <div
                    className={`absolute inset-0 bg-linear-to-r ${slide.gradient}`}
                  />

                  {/* Content */}
                  <div className="absolute inset-0 flex items-center">
                    <div className="container mx-auto px-6 md:px-12">
                      <div className="max-w-xl space-y-6">
                        {/* Badge */}
                        <div
                          className={`inline-flex items-center gap-2 ${slide.badgeColor} text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg`}
                        >
                          <Zap className="w-4 h-4" />
                          {slide.badge}
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-lg">
                          {slide.title}
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg md:text-xl text-white/90 max-w-md">
                          {slide.subtitle}
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap gap-4 pt-2">
                          <Link href={slide.link}>
                            <Button
                              size="lg"
                              className="h-12 px-8 text-base font-semibold bg-white text-gray-900 hover:bg-white/90 shadow-xl"
                            >
                              {slide.cta}
                              <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                          </Link>
                          <Link href="/products">
                            <Button
                              size="lg"
                              variant="outline"
                              className="h-12 px-8 text-base font-semibold border-white/50 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                            >
                              Browse All
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Arrows */}
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30" />

          {/* Slide Indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-3">
            {BANNER_SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`transition-all duration-300 rounded-full ${
                  current === index
                    ? "w-8 h-3 bg-white"
                    : "w-3 h-3 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </Carousel>
      </div>
    </section>
  );
}
