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
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Gift,
  Percent,
  Bell,
  Heart,
  Check,
} from "lucide-react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            window.location.origin,
        },
      });
      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    {
      icon: Gift,
      title: "Welcome Discount",
      description: "Get 10% off on your first order",
    },
    {
      icon: Percent,
      title: "Exclusive Deals",
      description: "Member-only discounts & offers",
    },
    {
      icon: Bell,
      title: "Early Access",
      description: "Be first to know about new arrivals",
    },
  ];

  const perks = [
    "Track your orders in real-time",
    "Save items to your wishlist",
    "Faster checkout experience",
    "Personalized recommendations",
  ];

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Branding & Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-emerald-600 via-emerald-500 to-teal-500 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-white/5 rounded-full" />

        {/* Logo & Brand */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-7 h-7 text-emerald-600" />
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
              Join Our Community!
            </h1>
            <p className="text-white/80 text-lg max-w-md">
              Create an account to unlock exclusive benefits and start your
              gadget journey with us.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{benefit.title}</h3>
                  <p className="text-white/70 text-sm">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Member Perks */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Member Perks
            </h3>
            <ul className="space-y-2">
              {perks.map((perk, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-white/80 text-sm"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/60 text-sm">
            Join 10,000+ happy customers today
          </p>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-10 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Gadgets Kabila
              </span>
            </Link>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold">
                Create Account
              </CardTitle>
              <CardDescription>
                Sign up to start shopping and enjoy exclusive benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
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
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 h-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="repeat-password"
                        type={showRepeatPassword ? "text" : "password"}
                        placeholder="Repeat your password"
                        required
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        className="pr-10 h-11"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowRepeatPassword(!showRepeatPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showRepeatPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Terms notice */}
                  <p className="text-xs text-muted-foreground">
                    By creating an account, you agree to our{" "}
                    <Link
                      href="/terms"
                      className="text-primary hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-primary hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </p>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold bg-emerald-600 hover:bg-emerald-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
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
                      Already have an account?
                    </span>
                  </div>
                </div>

                <Link href="/auth/login" className="block">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 text-base font-semibold"
                  >
                    Sign In Instead
                  </Button>
                </Link>
              </form>

              {/* Trust badges */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Gift className="w-4 h-4" />
                    <span>10% Welcome Offer</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Percent className="w-4 h-4" />
                    <span>Member Deals</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile benefits */}
          <div className="mt-6 lg:hidden">
            <div className="grid grid-cols-2 gap-3">
              {benefits.slice(0, 2).map((benefit, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center text-center p-3 bg-white rounded-lg shadow-sm"
                >
                  <benefit.icon className="w-5 h-5 text-emerald-600 mb-1" />
                  <span className="text-xs font-medium text-gray-700">
                    {benefit.title}
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
