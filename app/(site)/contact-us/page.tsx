"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  Globe,
  Users,
  Zap,
  Building2,
  Send,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import FAQSections from "@/components/faq-sections";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function ContactUsPage() {
  const { getSetting } = useStoreSettings([
    "contact_email",
    "contact_phone",
    "store_address",
    "store_city",
    "store_state",
    "store_pincode",
    "store_country",
  ]);

  const contactEmail = getSetting("contact_email", "support@gadgetkabila.com");
  const contactPhone = getSetting("contact_phone", "+91 8839978399");
  const storeAddress = getSetting(
    "store_address",
    "Shop no.3, Bhramha Krishna Tower, SMR Palace, Neelbad",
  );
  const storeCity = getSetting("store_city", "Bhopal");
  const storeState = getSetting("store_state", "Madhya Pradesh");
  const storePincode = getSetting("store_pincode", "462044");
  const storeCountry = getSetting("store_country", "India");

  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });

  // Check if user is logged in and pre-fill data
  useEffect(() => {
    const supabase = createClient();

    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setFormData((prev) => ({ ...prev, email: user.email || "" }));

        // Fetch customer data for name
        try {
          const response = await fetch(`/api/customers?user_id=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data) {
              setFormData((prev) => ({
                ...prev,
                firstName: data.first_name || "",
                lastName: data.last_name || "",
                phone: data.phone || prev.phone,
              }));
            }
          }
        } catch (err) {
          console.error("Error fetching customer data:", err);
        }
      }
    };

    checkUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to send message. Please try again.",
        );
      }

      setIsSubmitted(true);

      // Reset form after 3 seconds but keep user info
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData((prev) => ({
          firstName: user ? prev.firstName : "",
          lastName: user ? prev.lastName : "",
          email: user?.email || "",
          phone: user ? prev.phone : "",
          message: "",
        }));
      }, 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Header Section */}
      <div className="text-center py-12 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Ready to Get Started?
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Let&apos;s discuss your needs and see how we can help bring your
          vision to life.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Contact Info */}
          <div className="space-y-8">
            {/* Let's Talk Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Let&apos;s Talk
              </h2>
              <p className="text-gray-600">
                We&apos;re here to help you succeed. Whether you have a question
                about our products, need assistance with an order, or want to
                explore a partnership, we&apos;d love to hear from you.
              </p>
            </div>

            {/* Contact Options */}
            <div className="space-y-4">
              {/* Start a Chat */}
              <Link
                href="#"
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                  <MessageSquare className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Start a Chat</h3>
                  <p className="text-sm text-gray-500">
                    Get instant answers to your questions
                  </p>
                </div>
              </Link>

              {/* Email Us */}
              <Link
                href={`mailto:${contactEmail}`}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                  <Mail className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email Us</h3>
                  <p className="text-sm text-gray-500">{contactEmail}</p>
                </div>
              </Link>

              {/* Call Us */}
              <Link
                href={`tel:${contactPhone.replace(/\s/g, "")}`}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                  <Phone className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Call Us</h3>
                  <p className="text-sm text-gray-500">{contactPhone}</p>
                </div>
              </Link>

              {/* Schedule a Meeting */}
              <Link
                href="#"
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                  <Calendar className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Schedule a Meeting
                  </h3>
                  <p className="text-sm text-gray-500">
                    Book a time that works for you
                  </p>
                </div>
              </Link>
            </div>

            {/* Office Location */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Our Office</h3>
                  <address className="text-sm text-gray-600 not-italic mt-1">
                    {storeAddress}
                    <br />
                    {storeCity}, {storeState} {storePincode}
                    <br />
                    {storeCountry}
                  </address>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Mon - Sat, 10AM - 6PM IST</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="w-4 h-4" />
                  <span>Pan India Delivery</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-center mb-2">
                  <Users className="w-6 h-6 text-gray-700" />
                </div>
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-xs text-gray-500">Happy Customers</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-center mb-2">
                  <Zap className="w-6 h-6 text-gray-700" />
                </div>
                <div className="text-2xl font-bold text-gray-900">24hr</div>
                <div className="text-xs text-gray-500">Response Time</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-center mb-2">
                  <Building2 className="w-6 h-6 text-gray-700" />
                </div>
                <div className="text-2xl font-bold text-gray-900">15+</div>
                <div className="text-xs text-gray-500">States Served</div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Send us a Message
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Fill out the form and our team will get back to you within 24
                hours.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-medium text-red-800">
                    Failed to send message
                  </h4>
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              </div>
            )}

            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Message Sent!
                </h3>
                <p className="text-gray-600">
                  Thank you for reaching out. We&apos;ll get back to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={!!user}
                    className={user ? "bg-gray-50 cursor-not-allowed" : ""}
                  />
                  {user && (
                    <p className="text-xs text-gray-500">
                      Email is pre-filled from your account
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 12345 67890"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your inquiry, questions, or any specific requirements..."
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By submitting this form, you agree to our{" "}
                  <Link
                    href="/policies/privacy-policy"
                    className="underline hover:text-gray-700"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/policies/terms-and-conditions"
                    className="underline hover:text-gray-700"
                  >
                    Terms of Service
                  </Link>
                  .
                </p>
              </form>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Frequently Asked Questions?
          </h2>
          <FAQSections />
        </div>
      </div>
    </div>
  );
}
