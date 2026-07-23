"use client";

import type React from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  AlertCircle,
  ShoppingBag,
  Truck,
  Shield,
  CreditCard,
  Sparkles,
} from "lucide-react";
import OTPInputComponent from "@/components/otp-input-component";

import BASE_LOGO from "@/content/assets/logo/base-logo.png";
import { BrandName } from "@/components/brand-name";
import Image from "next/image";

const RESEND_SECONDS = 60;

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pageLoaded, setPageLoaded] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const isPhoneValid = phone.length === 10;

  // Keep the phone input disabled until the page (and all its scripts) has
  // fully finished loading, so users can't type into it before hydration.
  useEffect(() => {
    if (document.readyState === "complete") {
      setPageLoaded(true);
      return;
    }
    const handleLoad = () => setPageLoaded(true);
    window.addEventListener("load", handleLoad);
    return () => window.removeEventListener("load", handleLoad);
  }, []);

  // Focus the phone input as soon as it becomes interactive.
  useEffect(() => {
    if (pageLoaded) {
      phoneInputRef.current?.focus();
    }
  }, [pageLoaded]);

  // Countdown for the resend button.
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const sendOtp = async () => {
    if (!isPhoneValid) return;
    setError(null);
    setIsSendingOtp(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
      });
      if (error) throw error;
      setOtp("");
      setOtpSent(true);
      setResendTimer(RESEND_SECONDS);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to send OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    void sendOtp();
  };

  const handleResendOtp = () => {
    if (resendTimer > 0 || isSendingOtp) return;
    void sendOtp();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setError(null);
    setIsVerifying(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      router.push(redirect);
      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Invalid OTP");
    } finally {
      setIsVerifying(false);
    }
  };

  const features = [
    {
      icon: Truck,
      title: "Free Shipping",
      description: "All Over India",
    },
    {
      icon: Shield,
      title: "Secure Shopping",
      description: "100% protected payments",
    },
    {
      icon: CreditCard,
      title: "Video call support",
      description: "Monday - Saturday",
    },
  ];

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary/90 via-primary to-primary/80 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />

        {/* Main Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome Back!
            </h1>
            <p className="text-white/80 text-lg max-w-md">
              Sign in to access your account, track orders, and explore our
              latest gadgets collection.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/60 text-sm">
            Trusted by 10,000+ customers across India
          </p>
          <div className="flex items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Sparkles
                key={i}
                className="w-4 h-4 text-yellow-400 fill-yellow-400"
              />
            ))}
            <span className="text-white/80 text-sm ml-2">4.9/5 Rating</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-15 h-15 rounded-xl flex items-center justify-center">
                <Image
                  src={BASE_LOGO}
                  alt="Gadgets Kabila Logo"
                  className="w-15 h-15"
                />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Gadgets Kabila
              </span>
            </Link>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-0">
              {/* Logo & Brand */}
              <div className="relative z-10">
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center ">
                    <Image
                      src={BASE_LOGO}
                      alt="Gadgets Kabila Logo"
                      className="w-12 h-12"
                    />
                  </div>
                  <BrandName className="text-2xl font-bold text-white" />
                </Link>
              </div>
              <CardTitle className="text-2xl font-bold">
                Create Account
              </CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <InputGroup className="h-11">
                      <InputGroupAddon align="inline-start">
                        <InputGroupText className="mt-0.5">+91</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id="phone"
                        ref={phoneInputRef}
                        type="text"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="12345 67890"
                        required
                        disabled={otpSent || !pageLoaded}
                        maxLength={10}
                        pattern="[0-9]{10}"
                        value={phone}
                        onChange={(e) =>
                          setPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                      />
                    </InputGroup>
                  </div>

                  {!otpSent && (
                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-semibold"
                      disabled={!isPhoneValid || isSendingOtp}
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                  )}

                  {otpSent && (
                    <div className="grid gap-2">
                      <Label htmlFor="otp">OTP</Label>
                      <OTPInputComponent
                        value={otp}
                        onChange={setOtp}
                        disabled={isVerifying}
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {resendTimer > 0
                            ? `Resend OTP in ${resendTimer}s`
                            : "Didn't receive the code?"}
                        </span>
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resendTimer > 0 || isSendingOtp}
                          className="font-medium text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
                        >
                          {isSendingOtp ? "Resending..." : "Resend OTP"}
                        </button>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {otpSent && (
                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-semibold"
                      disabled={otp.length !== 6 || isVerifying}
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify OTP"
                      )}
                    </Button>
                  )}
                </div>
              </form>

              {/* Trust badges */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Shield className="w-4 h-4" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <CreditCard className="w-4 h-4" />
                    <span>Encrypted</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Truck className="w-4 h-4" />
                    <span>Fast Delivery</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer for mobile */}
          <p className="text-center text-sm text-muted-foreground mt-6 lg:hidden">
            Trusted by 10,000+ customers
          </p>
        </div>
      </div>
    </div>
  );
}
