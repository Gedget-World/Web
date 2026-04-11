"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  Package,
  CreditCard,
  Truck,
  RotateCcw,
  Shield,
  User,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  Headphones,
  FileText,
  HelpCircle,
  Zap,
  ShoppingBag,
  MapPin,
  Gift,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Settings,
} from "lucide-react";
import { useStoreSettings } from "@/hooks/use-store-settings";

const helpCategories = [
  {
    icon: Package,
    title: "Orders & Tracking",
    description: "Track orders, view history, cancel or modify",
    href: "/orders",
    color: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
  },
  {
    icon: Truck,
    title: "Shipping & Delivery",
    description: "Delivery times, shipping charges, locations",
    href: "/policies/shipping",
    color: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
  },
  {
    icon: RotateCcw,
    title: "Returns & Refunds",
    description: "Return policy, refund process, exchanges",
    href: "/policies/returns",
    color: "bg-orange-50 text-orange-600 group-hover:bg-orange-100",
  },
  {
    icon: CreditCard,
    title: "Payments",
    description: "Payment methods, failed transactions, COD",
    href: "/policies/payments",
    color: "bg-purple-50 text-purple-600 group-hover:bg-purple-100",
  },
  {
    icon: User,
    title: "Account & Profile",
    description: "Manage account, reset password, addresses",
    href: "/profile",
    color: "bg-pink-50 text-pink-600 group-hover:bg-pink-100",
  },
  {
    icon: Shield,
    title: "Privacy & Security",
    description: "Data protection, account security, privacy",
    href: "/policies/privacy",
    color: "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
  },
];

const popularQuestions = [
  {
    question: "How can I track my order?",
    answer:
      "Once your order is shipped, you'll receive a tracking link via email and SMS. You can also track it anytime from the 'My Orders' section in your account. Simply click on the order to view real-time tracking updates.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept UPI (Google Pay, PhonePe, Paytm), debit/credit cards (Visa, Mastercard, RuPay), net banking, and popular wallets. Cash on Delivery (COD) is available for orders between ₹599 and ₹10,000.",
  },
  {
    question: "What is your return and refund policy?",
    answer:
      "Most products are eligible for easy returns within 7 days of delivery. Items must be unused and in original packaging. Refunds are processed to your original payment method within 3–5 business days after pickup.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Standard delivery takes 3–7 business days depending on your location. Metro cities usually receive orders within 2-4 days. You can check estimated delivery time on the product page before ordering.",
  },
  {
    question: "Can I cancel or modify my order?",
    answer:
      "You can cancel your order before it's shipped from the 'My Orders' section. Once shipped, cancellation isn't possible, but you can refuse delivery or initiate a return after receiving.",
  },
  {
    question: "How do I apply a coupon code?",
    answer:
      "Enter your coupon code in the 'Apply Coupon' field on the cart or checkout page and click Apply. The discount will be reflected in your order total. Note: Only one coupon can be used per order.",
  },
  {
    question: "Is Cash on Delivery (COD) available?",
    answer:
      "Yes, COD is available for orders between ₹599 and ₹10,000. COD is not available when using discount coupons. An additional ₹40 COD handling fee may apply.",
  },
  {
    question: "How do I contact customer support?",
    answer:
      "You can reach us via email at support@gadgetkabila.com, call us at our helpline, or use the live chat feature. Our support team is available Monday to Saturday, 9 AM to 6 PM.",
  },
];

const quickLinks = [
  { title: "Track Your Order", href: "/orders", icon: MapPin },
  { title: "Return a Product", href: "/policies/returns", icon: RotateCcw },
  { title: "View All Policies", href: "/policies", icon: FileText },
  { title: "My Account", href: "/profile", icon: User },
  { title: "View Deals", href: "/deals", icon: Zap },
  { title: "Browse Products", href: "/products", icon: ShoppingBag },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { getSetting } = useStoreSettings(["contact_email", "contact_phone"]);

  const contactEmail = getSetting("contact_email", "support@gadgetkabila.com");
  const contactPhone = getSetting("contact_phone", "+91 9876543210");

  const filteredQuestions = searchQuery
    ? popularQuestions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : popularQuestions;

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-primary via-primary/95 to-primary/90 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="container relative px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Headphones className="w-3 h-3 mr-1" />
              24/7 Support Available
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              How can we help you?
            </h1>
            <p className="text-lg text-white/80 mb-8">
              Find answers to common questions, manage your orders, or get in
              touch with our support team.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for help topics, questions..."
                className="w-full pl-12 pr-4 py-6 text-lg rounded-xl bg-white text-gray-900 border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-white/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Popular Searches */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <span className="text-sm text-white/60">Popular:</span>
              {["Track order", "Return policy", "COD", "Refund status"].map(
                (term) => (
                  <button
                    key={term}
                    onClick={() => setSearchQuery(term)}
                    className="text-sm px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {term}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact Bar */}
      <section className="border-b bg-white">
        <div className="container px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 py-4 md:py-6 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Phone className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Call us at</p>
                <p className="font-medium text-gray-900">{contactPhone}</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-gray-200" />
            <div className="flex items-center gap-2 text-gray-600">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Email us at</p>
                <p className="font-medium text-gray-900">{contactEmail}</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-gray-200" />
            <div className="flex items-center gap-2 text-gray-600">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Support hours</p>
                <p className="font-medium text-gray-900">Mon-Sat, 9AM-6PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="container px-4 py-12 md:py-16">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-3">
            <BookOpen className="w-3 h-3 mr-1" />
            Browse Topics
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            What do you need help with?
          </h2>
          <p className="text-gray-600 mt-2">
            Select a category to find the help you need
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {helpCategories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${category.color}`}
              >
                <category.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                {category.title}
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                {category.description}
              </p>
              <span className="inline-flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ChevronRight className="w-4 h-4 ml-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Order Tracking CTA */}
      <section className="container px-4 pb-12">
        <div className="max-w-5xl mx-auto bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-10 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-50" />

          <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="shrink-0">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
                <Package className="w-10 h-10" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold mb-2">
                Track Your Order
              </h3>
              <p className="text-white/80 mb-4">
                Enter your order ID to get real-time updates on your shipment
                status, delivery date, and more.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto md:mx-0">
                <Input
                  placeholder="Enter Order ID (e.g., GK-123456)"
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                />
                <Button className="bg-white text-blue-600 hover:bg-white/90 font-semibold">
                  <MapPin className="w-4 h-4 mr-2" />
                  Track Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-12 md:py-16">
        <div className="container px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-3 bg-white">
                <HelpCircle className="w-3 h-3 mr-1" />
                FAQ
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600 mt-2">
                Quick answers to common questions
              </p>
            </div>

            {searchQuery && filteredQuestions.length === 0 && (
              <div className="text-center py-10 bg-white rounded-xl border">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  No results found for "{searchQuery}"
                </p>
                <Button
                  variant="link"
                  onClick={() => setSearchQuery("")}
                  className="mt-2"
                >
                  Clear search
                </Button>
              </div>
            )}

            <div className="bg-white rounded-2xl border shadow-sm">
              <Accordion type="single" collapsible className="divide-y">
                {filteredQuestions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border-0"
                  >
                    <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-900 pr-4">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 text-gray-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="text-center mt-8">
              <p className="text-gray-500 mb-4">
                Can't find what you're looking for?
              </p>
              <Button asChild>
                <Link href="/contact-us">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="container px-4 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3">
              <Zap className="w-3 h-3 mr-1" />
              Quick Links
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Helpful Resources
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <link.icon className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  {link.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
