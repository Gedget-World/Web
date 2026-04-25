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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ShoppingBag,
  KeyRound,
  Mail,
  Shield,
  Clock,
  HelpCircle,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const searchParams = useSearchParams();

  // Surface any error returned from /auth/callback or /auth/reset-password
  // (e.g. when an emailed reset link has expired).
  useEffect(() => {
    const errParam = searchParams.get("error");
    if (errParam) {
      setError(errParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/auth/reset-password`,
      });
      if (error) throw error;
      setIsSubmitted(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    {
      icon: Mail,
      title: "Enter Email",
      description: "Provide your registered email",
    },
    {
      icon: KeyRound,
      title: "Check Inbox",
      description: "Click the reset link we send",
    },
    {
      icon: Shield,
      title: "Set New Password",
      description: "Create a secure password",
    },
  ];

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Branding & Steps */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-amber-500 via-orange-500 to-amber-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-white/5 rounded-full" />

        {/* Logo & Brand */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-7 h-7 text-amber-600" />
            </div>
            <span className="text-2xl font-bold text-white">
              Gadgets Kabila
            </span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Reset Your Password
            </h1>
            <p className="text-white/80 text-lg max-w-md">
              Don&apos;t worry, it happens to the best of us. We&apos;ll help
              you get back into your account in no time.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center relative">
                  <step.icon className="w-6 h-6 text-white" />
                  <span className="absolute -top-2 -left-2 w-6 h-6 bg-white text-amber-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                  <p className="text-white/70 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Help tip */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-white mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-1">Need Help?</h3>
                <p className="text-white/70 text-sm">
                  If you don&apos;t receive the email within a few minutes,
                  check your spam folder or contact our support team.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/60 text-sm">
            Your security is our top priority
          </p>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Gadgets Kabila
              </span>
            </Link>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-2">
                <KeyRound className="w-7 h-7 text-amber-600" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Forgot Password?
              </CardTitle>
              <CardDescription>
                No worries! Enter your email and we&apos;ll send you a reset
                link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">
                    Check Your Email
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    We&apos;ve sent a password reset link to{" "}
                    <span className="font-semibold text-foreground block mt-1">
                      {email}
                    </span>
                  </p>

                  <div className="w-full space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Link expires in 1 hour</span>
                    </div>

                    <Link href="/auth/login" className="block">
                      <Button variant="outline" className="w-full h-11">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Login
                      </Button>
                    </Link>

                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="text-sm text-primary hover:underline w-full text-center"
                    >
                      Didn&apos;t receive email? Try again
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    {error && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-semibold bg-amber-500 hover:bg-amber-600"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Reset Link
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-4 text-muted-foreground">
                        Remember your password?
                      </span>
                    </div>
                  </div>

                  <Link href="/auth/login" className="block">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 text-base font-semibold"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                </form>
              )}

              {/* Security note */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                  <Shield className="w-4 h-4" />
                  <span>Your account security is our priority</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile steps */}
          <div className="mt-6 lg:hidden">
            <p className="text-center text-sm text-muted-foreground mb-4">
              How it works
            </p>
            <div className="flex justify-center gap-8">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-2 relative">
                    <step.icon className="w-5 h-5 text-amber-600" />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
