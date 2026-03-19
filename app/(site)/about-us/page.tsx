import {
  Target,
  Eye,
  Heart,
  Award,
  Users,
  ShoppingBag,
  Truck,
  Shield,
  Headphones,
  MapPin,
  Calendar,
  TrendingUp,
  Star,
  CheckCircle,
  Zap,
  Globe,
  Package,
} from "lucide-react";
import Image from "next/image";
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
              About <span className="text-blue-400">Gadgets Kabila</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              {/* ⚠️ [UPDATE: Write your company tagline/introduction] */}
              Your one-stop destination for the latest gadgets and electronics.
              We bring technology closer to you with quality products,
              competitive prices, and exceptional service.
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

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900">
                {/* ⚠️ [UPDATE: Enter your actual number] */}
                10,000+
              </div>
              <div className="text-gray-600 mt-1">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900">
                {/* ⚠️ [UPDATE: Enter your actual number] */}
                5,000+
              </div>
              <div className="text-gray-600 mt-1">Products Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900">
                {/* ⚠️ [UPDATE: Enter your actual number] */}
                100+
              </div>
              <div className="text-gray-600 mt-1">Brands</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gray-900">
                {/* ⚠️ [UPDATE: Enter your actual number] */}
                28+
              </div>
              <div className="text-gray-600 mt-1">States Delivered</div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              {/* ⚠️ [UPDATE: Write your actual company story below] */}
              <div className="space-y-4 text-gray-600">
                <p>
                  <strong>Gadgets Kabila</strong> was founded in{" "}
                  <span className="font-semibold">
                    {/* ⚠️ [UPDATE: Enter founding year] */}
                    2020
                  </span>{" "}
                  with a simple mission: to make quality gadgets and electronics
                  accessible to everyone across India.
                </p>
                <p>
                  What started as a small venture has grown into a trusted
                  e-commerce platform serving thousands of customers nationwide.
                  Our journey has been driven by our passion for technology and
                  our commitment to customer satisfaction.
                </p>
                <p>
                  Today, we offer a wide range of products including
                  smartphones, laptops, audio devices, smart home gadgets,
                  gaming accessories, and much more from leading brands and
                  emerging innovators.
                </p>
                <p>
                  Based in{" "}
                  <span className="font-semibold">
                    {/* ⚠️ [UPDATE: Enter your city] */}
                    Bengaluru, Karnataka
                  </span>
                  , we serve customers across India with fast delivery and
                  reliable after-sales support.
                </p>
              </div>
            </div>
            <div className="relative">
              {/* ⚠️ [UPDATE: Replace with your actual company/team image] */}
              <div className="aspect-square bg-linear-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                <div className="text-center p-8">
                  <Package className="w-24 h-24 text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm">
                    {/* ⚠️ [UPDATE: Add your company image at /public/about-us.jpg and uncomment the Image component below] */}
                    Add your company image here
                  </p>
                </div>
              </div>
              {/* Uncomment and update when you have an image:
              <Image
                src="/about-us.jpg"
                alt="Gadgets Kabila Team"
                fill
                className="object-cover rounded-2xl"
              />
              */}
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Drives Us
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our mission, vision, and values guide every decision we make at
              Gadgets Kabila.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Mission */}
            <div className="bg-blue-50 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Our Mission
              </h3>
              {/* ⚠️ [UPDATE: Write your actual mission statement] */}
              <p className="text-gray-600">
                To empower every Indian with access to quality technology
                products at fair prices, backed by exceptional customer service
                and a seamless shopping experience.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-green-50 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Our Vision
              </h3>
              {/* ⚠️ [UPDATE: Write your actual vision statement] */}
              <p className="text-gray-600">
                To become India&apos;s most trusted online destination for
                gadgets and electronics, known for authenticity, affordability,
                and innovation.
              </p>
            </div>

            {/* Values */}
            <div className="bg-purple-50 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Our Values
              </h3>
              {/* ⚠️ [UPDATE: Write your actual core values] */}
              <p className="text-gray-600">
                Customer First • Authenticity • Transparency • Innovation •
                Integrity • Excellence
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Gadgets Kabila?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We go the extra mile to ensure you have the best shopping
              experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "100% Authentic Products",
                description:
                  "Every product is sourced directly from authorized distributors and brands. No fakes, ever.",
                color: "blue",
              },
              {
                icon: Truck,
                title: "Fast & Free Delivery",
                // ⚠️ [UPDATE: Update delivery terms]
                description:
                  "Free shipping on orders above ₹499. Express delivery available in select cities.",
                color: "green",
              },
              {
                icon: Award,
                title: "Genuine Warranty",
                description:
                  "All products come with official manufacturer warranty. We help you with warranty claims.",
                color: "yellow",
              },
              {
                icon: Headphones,
                title: "Dedicated Support",
                // ⚠️ [UPDATE: Update support hours]
                description:
                  "Our customer support team is available Mon-Sat, 10 AM - 6 PM to assist you.",
                color: "purple",
              },
              {
                icon: Zap,
                title: "Easy Returns",
                // ⚠️ [UPDATE: Update return policy days]
                description:
                  "Changed your mind? Easy returns within 7 days. No questions asked.",
                color: "orange",
              },
              {
                icon: Globe,
                title: "Pan India Delivery",
                // ⚠️ [UPDATE: Update PIN codes served]
                description:
                  "We deliver to 20,000+ PIN codes across India. From metros to small towns.",
                color: "teal",
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

      {/* Product Categories */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What We Sell
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From everyday essentials to cutting-edge tech, we have something
              for everyone.
            </p>
          </div>

          {/* ⚠️ [UPDATE: Update categories based on your actual product range] */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Smartphones & Tablets",
              "Laptops & Computers",
              "Audio & Headphones",
              "Smart Watches",
              "Gaming Accessories",
              "Smart Home Devices",
              "Cameras & Drones",
              "Mobile Accessories",
              "Power Banks & Chargers",
              "Networking & Storage",
              "TV & Entertainment",
              "And Much More...",
            ].map((category, index) => (
              <div
                key={index}
                className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gray-100 transition-colors"
              >
                <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  {category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section (Optional) */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The passionate people behind Gadgets Kabila.
            </p>
          </div>

          {/* ⚠️ [UPDATE: Add your actual team members below] */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "[Founder Name]", // ⚠️ [UPDATE]
                role: "Founder & CEO",
                image: null,
              },
              {
                name: "[Co-Founder Name]", // ⚠️ [UPDATE]
                role: "Co-Founder & COO",
                image: null,
              },
              {
                name: "[Team Member]", // ⚠️ [UPDATE]
                role: "Head of Operations",
                image: null,
              },
              {
                name: "[Team Member]", // ⚠️ [UPDATE]
                role: "Customer Success Lead",
                image: null,
              },
            ].map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 text-center border border-gray-200"
              >
                {/* ⚠️ [UPDATE: Add team member images] */}
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
            ))}
          </div>

          {/* ⚠️ [UPDATE: Remove this note when you add actual team info] */}
          <p className="text-center text-sm text-gray-400 mt-8">
            Update this section with your actual team information or remove if
            not needed.
          </p>
        </div>
      </section>

      {/* Milestones / Timeline (Optional) */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Journey
            </h2>
            <p className="text-gray-600">
              Key milestones in the Gadgets Kabila story.
            </p>
          </div>

          {/* ⚠️ [UPDATE: Add your actual company milestones] */}
          <div className="space-y-8">
            {[
              {
                year: "2020", // ⚠️ [UPDATE]
                title: "The Beginning",
                description:
                  "Gadgets Kabila was founded with a vision to democratize access to technology.",
              },
              {
                year: "2021", // ⚠️ [UPDATE]
                title: "1,000 Customers",
                description:
                  "Reached our first 1,000 happy customers milestone.",
              },
              {
                year: "2022", // ⚠️ [UPDATE]
                title: "Expanded Product Range",
                description:
                  "Added 50+ new brands and expanded to 3,000+ products.",
              },
              {
                year: "2023", // ⚠️ [UPDATE]
                title: "Pan India Delivery",
                description:
                  "Launched delivery services across 20,000+ PIN codes.",
              },
              {
                year: "2024", // ⚠️ [UPDATE]
                title: "10,000+ Customers",
                description:
                  "Crossed 10,000 customers and launched our mobile app.",
              },
              {
                year: "2025", // ⚠️ [UPDATE]
                title: "And Growing...",
                description:
                  "Continuing to innovate and serve our customers better every day.",
              },
            ].map((milestone, index) => (
              <div key={index} className="flex gap-6">
                <div className="shrink-0 w-20 text-right">
                  <span className="inline-flex items-center justify-center px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-sm">
                    {milestone.year}
                  </span>
                </div>
                <div className="flex-1 pb-8 border-l-2 border-gray-200 pl-6 relative">
                  <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-[7px] top-1"></div>
                  <h3 className="font-semibold text-gray-900">
                    {milestone.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {milestone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-gray-600">
              Don&apos;t just take our word for it.
            </p>
          </div>

          {/* ⚠️ [UPDATE: Add actual customer testimonials] */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Rahul S.", // ⚠️ [UPDATE]
                location: "Mumbai", // ⚠️ [UPDATE]
                rating: 5,
                text: "Excellent service! Got my laptop delivered within 2 days. Product was genuine and well-packed.", // ⚠️ [UPDATE]
              },
              {
                name: "Priya M.", // ⚠️ [UPDATE]
                location: "Delhi", // ⚠️ [UPDATE]
                rating: 5,
                text: "Best prices I found online. Customer support was very helpful when I had questions about my order.", // ⚠️ [UPDATE]
              },
              {
                name: "Arun K.", // ⚠️ [UPDATE]
                location: "Bangalore", // ⚠️ [UPDATE]
                rating: 5,
                text: "I've ordered multiple times from Gadgets Kabila. Never disappointed. Highly recommended!", // ⚠️ [UPDATE]
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl border border-gray-200"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  &quot;{testimonial.text}&quot;
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-linear-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Shop?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Explore our wide range of gadgets and electronics. Quality products,
            competitive prices, and excellent service guaranteed.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/products">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Shop Now
              </Button>
            </Link>
            <Link href="/contact-us">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <Headphones className="w-5 h-5 mr-2" />
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Info Footer */}
      <section className="py-12 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <MapPin className="w-6 h-6 mx-auto mb-3 text-blue-400" />
              <h3 className="font-semibold mb-2">Our Office</h3>
              {/* ⚠️ [UPDATE: Enter your actual address] */}
              <p className="text-gray-400 text-sm">
                123 Business Avenue, Suite 100
                <br />
                Bengaluru, Karnataka 560001
                <br />
                India
              </p>
            </div>
            <div>
              <Headphones className="w-6 h-6 mx-auto mb-3 text-blue-400" />
              <h3 className="font-semibold mb-2">Contact Us</h3>
              {/* ⚠️ [UPDATE: Enter your actual contact details] */}
              <p className="text-gray-400 text-sm">
                Email: support@gadgetskabila.com
                <br />
                Phone: +91 12345 67890
                <br />
                Mon - Sat, 10 AM - 6 PM IST
              </p>
            </div>
            <div>
              <Calendar className="w-6 h-6 mx-auto mb-3 text-blue-400" />
              <h3 className="font-semibold mb-2">Business Hours</h3>
              {/* ⚠️ [UPDATE: Enter your actual business hours] */}
              <p className="text-gray-400 text-sm">
                Monday - Saturday
                <br />
                10:00 AM - 6:00 PM IST
                <br />
                Sunday: Closed
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
