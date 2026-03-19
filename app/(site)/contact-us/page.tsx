"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import Link from "next/link";
import FAQSections from "@/components/faq-sections";

export default function ContactUsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    inquiryType: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call - Replace with actual API integration
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // TODO: Integrate with your backend/email service
    console.log("Form submitted:", formData);

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        inquiryType: "",
        message: "",
      });
    }, 3000);
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
                href="mailto:support@gadgetskabila.com"
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                  <Mail className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email Us</h3>
                  <p className="text-sm text-gray-500">
                    support@gadgetskabila.com
                  </p>
                </div>
              </Link>

              {/* Call Us */}
              <Link
                href="tel:+911234567890"
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors">
                  <Phone className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Call Us</h3>
                  <p className="text-sm text-gray-500">+91 12345 67890</p>
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
                    123 Business Avenue, Suite 100
                    <br />
                    Bengaluru, Karnataka 560001
                    <br />
                    India
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
                  />
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

                {/* Company */}
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    placeholder="Your company name"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>

                {/* Inquiry Type */}
                <div className="space-y-2">
                  <Label htmlFor="inquiryType">Inquiry Type</Label>
                  <Select
                    value={formData.inquiryType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, inquiryType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select inquiry type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="product">
                        Product Information
                      </SelectItem>
                      <SelectItem value="order">Order Support</SelectItem>
                      <SelectItem value="return">Returns & Refunds</SelectItem>
                      <SelectItem value="bulk">Bulk / B2B Orders</SelectItem>
                      <SelectItem value="partnership">
                        Partnership Inquiry
                      </SelectItem>
                      <SelectItem value="feedback">
                        Feedback / Suggestion
                      </SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
          <p className="text-gray-600 mb-6">
            Check out our{" "}
            <Link
              href="/policies/contact-information-policy"
              className="text-blue-600 hover:underline"
            >
              Grievance & Contact Policy
            </Link>{" "}
            for more information about how we handle your inquiries.
          </p>
          <FAQSections />
        </div>
      </div>
    </div>
  );
}
