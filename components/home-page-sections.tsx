"use client";

import { LazySection, SectionSkeleton } from "@/components/lazy-section";
import ProductsList from "@/components/Products-list";
import FeaturedSection from "@/components/featured-section";
import FAQSections from "@/components/faq-sections";
import { Banners } from "@/components/banners";
import { RecentlyViewedProducts } from "@/components/recently-viewed-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Star,
  Quote,
  Mail,
  Gift,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  discount_percentage: number | null;
  is_featured: boolean;
  stock: number;
  average_rating?: number;
  review_count?: number;
  is_out_of_stock: boolean;
}

interface HomePageSectionsProps {
  featuredProducts: Product[];
  arrivalProducts: Product[];
}

// Testimonials Section Component
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Amit Gupta",
      location: "Pune",
      rating: 5,
      text: "Bhai seriously the delivery speed is insane! Ordered on monday got on wednesday, came packed in bubble wrap like it was fragile. Real 5/5",
      avatar: "AG",
    },
    {
      name: "Tanvi Singh",
      location: "Gurgaon",
      rating: 5,
      text: "My mom wanted these earphones, i was skeptical but OMG so good for the price. Way better than local shops. Telling everyone now 🙌",
      avatar: "TS",
    },
    {
      name: "Rajesh Kumar",
      location: "Kolkata",
      rating: 5,
      text: "Got 3 orders from here and havent been disappointed once. Customer service reply in 2 mins itself! This is how it should be.",
      avatar: "RK",
    },
    {
      name: "Priya Das",
      location: "Chennai",
      rating: 5,
      text: "Finally found a place that's not overpriced like amazon! Plus return process is so smooth, just collect from home. Thumbs up",
      avatar: "PD",
    },
    {
      name: "Vikram Singh",
      location: "Delhi",
      rating: 5,
      text: "Ordered during diwali sale and prices were genuinely good, not like fake discounts. Already ordered again lol",
      avatar: "VS",
    },
    {
      name: "Rohan Mehta",
      location: "Bangalore",
      rating: 5,
      text: "My gf uses it every day now, says its perfect for office. Quality is solid, not cheaply made like other brands. Worth every paisa.",
      avatar: "RM",
    },
    {
      name: "Arun Nair",
      location: "Kochi",
      rating: 5,
      text: "Cashfree payment works perfectly, no issues with any payment method. Also got the product in sealed box which was nice",
      avatar: "AN",
    },
    {
      name: "Suresh Yadav",
      location: "Jaipur",
      rating: 5,
      text: "Ordered 5 items for my shop and they gave bulk discount without me even asking! Proper business ethic visible here",
      avatar: "SY",
    },
    {
      name: "Harsh Patel",
      location: "Ahmedabad",
      rating: 5,
      text: "Thought it would take 2 weeks but it reached in 3 days to my village itself! Shocked honestly. Product is dope too",
      avatar: "HP",
    },
    {
      name: "Neha Kapoor",
      location: "Hyderabad",
      rating: 5,
      text: "Using for 2 months now and zero complaints. Battery life is even better than expected. This is what quality feels like",
      avatar: "NK",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);

  // Auto-shift carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 640) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };

    updateCardsPerView();
    window.addEventListener("resize", updateCardsPerView);
    return () => window.removeEventListener("resize", updateCardsPerView);
  }, []);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1,
    );
  };

  const visibleTestimonials = Array.from({ length: cardsPerView }, (_, idx) => {
    return testimonials[(currentIndex + idx) % testimonials.length];
  });

  const isActiveDot = (dotIndex: number) => {
    return Array.from({ length: cardsPerView }).some(
      (_, idx) => (currentIndex + idx) % testimonials.length === dotIndex,
    );
  };

  return (
    <section className="bg-linear-to-b from-white to-gray-50 py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            <Star className="w-4 h-4 fill-yellow-500" />
            Customer Reviews
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of happy customers who trust us for their gadget
            needs
          </p>
        </div>

        {/* Carousel */}
        <div className="mx-auto max-w-6xl">
          <div className="relative">
            {/* Testimonial Cards Grid */}
            <div
              className={`grid gap-4 sm:gap-6 ${
                cardsPerView === 1
                  ? "grid-cols-1"
                  : cardsPerView === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {visibleTestimonials.map((testimonial, idx) => (
                <div
                  key={`${currentIndex}-${idx}`}
                  className="relative animate-fadeIn rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-lg sm:p-6 lg:p-8"
                >
                  <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/10 sm:right-6 sm:top-6 sm:h-10 sm:w-10" />
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400 sm:h-5 sm:w-5"
                      />
                    ))}
                  </div>
                  <p className="mb-5 line-clamp-5 text-sm leading-relaxed text-gray-600 sm:mb-6 sm:text-base">
                    {testimonial.text}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {testimonial.avatar}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.location}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={goToPrev}
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-primary p-2 text-white transition-colors hover:bg-primary/90 md:block"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-primary p-2 text-white transition-colors hover:bg-primary/90 md:block"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  isActiveDot(index)
                    ? "bg-primary w-8"
                    : "bg-gray-300 w-2 hover:bg-gray-400"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          <div className="mt-4 flex justify-center gap-3 md:hidden">
            <Button variant="outline" size="icon" onClick={goToPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Trust stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "10K+", label: "Happy Customers" },
            { value: "2K+", label: "Products Sold" },
            { value: "15+", label: "States Served" },
            { value: "99%", label: "Satisfaction Rate" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">
                {stat.value}
              </p>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-in-out;
          }
        `}</style>
      </div>
    </section>
  );
}

// Newsletter Section Component
function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-gray-900 via-gray-800 to-gray-900">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

          <div className="relative z-10 py-16 px-8 md:px-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Gift className="w-4 h-4" />
              Get 10% Off Your First Order
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto mb-8">
              Stay updated with the latest products, exclusive deals, and tech
              news. Be the first to know about our special offers!
            </p>

            {isSubscribed ? (
              <div className="flex items-center justify-center gap-3 bg-green-500/20 text-green-400 px-6 py-4 rounded-xl max-w-md mx-auto">
                <CheckCircle className="w-6 h-6" />
                <span className="font-medium">
                  Thank you for subscribing! Check your inbox for welcome
                  discount.
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
              >
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-primary"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-8 font-semibold"
                >
                  Subscribe
                  <Sparkles className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}

            <p className="text-gray-500 text-sm mt-4">
              By subscribing, you agree to our Privacy Policy. Unsubscribe
              anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

interface HomePageSectionsProps {
  featuredProducts: Product[];
  arrivalProducts: Product[];
}

export function HomePageSections({
  featuredProducts,
  arrivalProducts,
}: HomePageSectionsProps) {
  return (
    <>
      {/* Dynamic Banners Below Hero Section */}
      <LazySection fallback={<SectionSkeleton height="220px" />}>
        <Banners placementName="home-page-below-hero-section" />
      </LazySection>

      {/* Featured Products */}
      <LazySection fallback={<SectionSkeleton height="500px" />}>
        <ProductsList
          products={featuredProducts}
          heading="Featured Products"
          exploreLink="/products?featured=true"
        />
      </LazySection>

      {/* New Arrivals */}
      <LazySection fallback={<SectionSkeleton height="500px" />}>
        <ProductsList
          products={arrivalProducts}
          heading="New Arrivals"
          exploreLink="/products?newArrival=true"
        />
      </LazySection>

      {/* Recently Viewed */}
      <LazySection fallback={<SectionSkeleton height="300px" />}>
        <RecentlyViewedProducts />
      </LazySection>

      {/* Testimonials */}
      <LazySection fallback={<SectionSkeleton height="500px" />}>
        <TestimonialsSection />
      </LazySection>

      {/* Featured Section */}
      {/* <LazySection fallback={<SectionSkeleton height="400px" />}>
        <FeaturedSection />
      </LazySection> */}

      {/* Newsletter */}
      {/* <LazySection fallback={<SectionSkeleton height="350px" />}>
        <NewsletterSection />
      </LazySection> */}

      {/* FAQ */}
      <LazySection fallback={<SectionSkeleton height="400px" />}>
        <FAQSections />
      </LazySection>

      {/* Dynamic Banners Above Footer */}
      <LazySection fallback={<SectionSkeleton height="220px" />}>
        <Banners placementName="home-page-above-footer" />
      </LazySection>
    </>
  );
}
