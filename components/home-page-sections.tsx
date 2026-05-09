"use client";

import { LazySection, SectionSkeleton } from "@/components/lazy-section";
import ProductsList from "@/components/Products-list";
import FeaturedSection from "@/components/featured-section";
import FAQSections from "@/components/faq-sections";
import { RecentlyViewedProducts } from "@/components/recently-viewed-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Quote, Mail, Gift, CheckCircle, Sparkles } from "lucide-react";
import { useState } from "react";

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
      name: "Priya Sharma",
      location: "Mumbai",
      rating: 5,
      text: "Amazing quality products and super fast delivery! The customer service is exceptional. Will definitely shop again.",
      avatar: "PS",
    },
    {
      name: "Rahul Verma",
      location: "Delhi",
      rating: 5,
      text: "Best prices I've found for gadgets. The packaging was secure and the product exceeded my expectations.",
      avatar: "RV",
    },
    {
      name: "Anita Patel",
      location: "Bangalore",
      rating: 5,
      text: "I love shopping here! Great selection of products, easy returns, and the deals are unbeatable.",
      avatar: "AP",
    },
  ];

  return (
    <section className="py-16 bg-linear-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
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

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow relative"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10" />
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                &ldquo;{testimonial.text}&rdquo;
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
    </>
  );
}
