import {
  Target,
  Eye,
  Sparkles,
  Gift,
  ShoppingBag,
  Headphones,
  TrendingUp,
  CheckCircle,
  Heart,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 md:py-28">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              About <span className="text-blue-400">GadgetsKabila</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Your ultimate destination for discovering the extraordinary in
              everyday life.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/products">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Explore Products
                </Button>
              </Link>
              <Link href="/contact-us">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-black hover:bg-white hover:text-gray-900"
                >
                  <Headphones className="w-5 h-5 mr-2" />
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome / Intro Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-6 text-gray-700 text-base md:text-lg leading-relaxed">
            <p>
              Welcome to <strong>GadgetsKabila</strong>, your ultimate
              destination for discovering the extraordinary in everyday life. We
              are more than just an online platform—we are a carefully curated
              hub of innovation, creativity, and convenience, built for people
              who love unique gadgets, thoughtful gifts, and smart personal-use
              products that make life better.
            </p>
            <p>
              At GadgetsKabila, we believe that the right product can spark joy,
              simplify routines, and even become a conversation starter.
              That&apos;s why we go beyond the ordinary to bring you a
              collection that stands out—whether it&apos;s a clever tech gadget,
              a fun lifestyle accessory, or a meaningful gift for someone
              special.
            </p>
            <p>
              In a world filled with repetitive choices, we saw the space for a
              platform that offers something different—products that are not
              only functional but also exciting and memorable.
            </p>
            <p>
              From everyday essentials to quirky innovations, we constantly
              explore global trends and emerging ideas to bring you items that
              sparkle your life.
            </p>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What We Offer
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our collection is designed to cater to a wide range of needs and
              personalities.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Sparkles,
                title: "Unique Gadgets",
                description:
                  "Smart, innovative, and often surprising tools that enhance your daily life.",
                color: "blue",
              },
              {
                icon: Gift,
                title: "Amazing Gifts",
                description:
                  "Perfect picks for birthdays, anniversaries, festivals, or just because—you'll always find something thoughtful and distinctive.",
                color: "pink",
              },
              {
                icon: Heart,
                title: "Personal Use Products",
                description:
                  "Practical items designed to improve comfort, convenience, and lifestyle.",
                color: "purple",
              },
              {
                icon: TrendingUp,
                title: "Trending Finds",
                description:
                  "Stay ahead with products that are gaining attention and popularity worldwide.",
                color: "green",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-${feature.color}-100`}
                >
                  <feature.icon
                    className={`w-6 h-6 text-${feature.color}-600`}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose GadgetsKabila?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "Carefully Curated Selection",
                description:
                  "Every product is chosen with attention to quality, usefulness, and uniqueness.",
              },
              {
                title: "Customer-Centric Approach",
                description:
                  "Your satisfaction is at the heart of everything we do.",
              },
              {
                title: "Affordable Innovation",
                description:
                  "We believe great products shouldn't come with a heavy price tag.",
              },
              {
                title: "Constant Discovery",
                description:
                  "We're always updating our collection to keep things fresh and exciting.",
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-4 p-6 bg-gray-50 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-blue-50 rounded-2xl p-8 md:p-10">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Our Mission
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Our mission is simple: to bring innovation, joy, and convenience
                into your everyday life through thoughtfully selected products.
                We aim to become your go-to platform whenever you&apos;re
                looking for something different—something that makes you say,{" "}
                <em>
                  &quot;I didn&apos;t know I needed this, but I love it!&quot;
                </em>
              </p>
            </div>

            {/* Vision */}
            <div className="bg-green-50 rounded-2xl p-8 md:p-10">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Eye className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Our Vision
              </h3>
              <p className="text-gray-700 leading-relaxed">
                We envision GadgetsKabila as an incredible community of curious
                minds and smart shoppers who appreciate creativity,
                functionality, and style—all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer is King */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="space-y-6 text-gray-700 text-base md:text-lg leading-relaxed">
            <p>
              At GadgetsKabila, every product tells a story, and every purchase
              is an experience. Whether you&apos;re shopping for yourself or
              searching for the perfect gift, we&apos;re here to help you
              discover something truly special.
            </p>
          </div>

          <div className="mt-10 bg-linear-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl p-8 md:p-10">
            <Crown className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-lg md:text-xl font-bold text-gray-900 leading-snug">
              CUSTOMER IS THE ONLY KING IN THE WORLD
              <br />
              <span className="text-amber-600">AND THAT IS YOU.</span>
            </p>
          </div>

          <p className="mt-10 text-xl md:text-2xl font-semibold text-gray-900">
            Explore. Discover. Experience the difference with{" "}
            <span className="text-blue-600">GadgetsKabila</span>.
          </p>
        </div>
      </section>
    </div>
  );
}
