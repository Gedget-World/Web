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
import { useState, useEffect, useMemo } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  ShoppingBag,
  Lock,
  Shield,
  KeyRound,
  Check,
  X,
} from "lucide-react";

// Password strength checker
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 4) return { score, label: "Medium", color: "bg-yellow-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );

  const passwordRequirements = [
    { met: password.length >= 6, text: "At least 6 characters" },
    { met: /[a-z]/.test(password), text: "One lowercase letter" },
    { met: /[A-Z]/.test(password), text: "One uppercase letter" },
    { met: /[0-9]/.test(password), text: "One number" },
  ];

  useEffect(() => {
    const supabase = createClient();

    // Check current session first
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // If there's a session with a user, they might be in recovery mode
      // The hash fragment from email link triggers PASSWORD_RECOVERY event
      if (!session) {
        // No session at all - redirect to forgot password
        router.push("/auth/forgot-password");
        return;
      }

      // Listen for auth state changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsAuthorized(true);
          setIsCheckingAuth(false);
        } else if (event === "SIGNED_IN") {
          // User signed in normally, not through recovery
          // Check if they have recovery token in URL hash
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1),
          );
          if (hashParams.get("type") === "recovery") {
            setIsAuthorized(true);
            setIsCheckingAuth(false);
          } else {
            router.push("/");
          }
        }
      });

      // Check URL hash for recovery token
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get("type");
      const accessToken = hashParams.get("access_token");

      if (type === "recovery" && accessToken) {
        setIsAuthorized(true);
        setIsCheckingAuth(false);
      } else if (session) {
        // Give a short delay for PASSWORD_RECOVERY event to fire
        setTimeout(() => {
          if (!isAuthorized) {
            setIsCheckingAuth(false);
            router.push("/auth/forgot-password");
          }
        }, 2000);
      } else {
        setIsCheckingAuth(false);
        router.push("/auth/forgot-password");
      }

      return () => {
        subscription.unsubscribe();
      };
    };

    checkSession();
  }, [router, isAuthorized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      if (error) throw error;
      setIsSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const tips = [
    {
      icon: Lock,
      title: "Use a Strong Password",
      description: "Mix letters, numbers & symbols",
    },
    {
      icon: Shield,
      title: "Keep It Unique",
      description: "Don't reuse passwords",
    },
    {
      icon: KeyRound,
      title: "Store It Safely",
      description: "Use a password manager",
    },
  ];

  // Show loading while checking authorization
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          <p className="text-muted-foreground">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  // If not authorized, show message (will redirect shortly)
  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-6">
        <Card className="max-w-md border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-bold text-xl text-gray-900 mb-2">
                Invalid or Expired Link
              </h3>
              <p className="text-muted-foreground mb-6">
                This password reset link is invalid or has expired. Please
                request a new one.
              </p>
              <Link href="/auth/forgot-password" className="w-full">
                <Button className="w-full h-11 bg-violet-600 hover:bg-violet-700">
                  Request New Reset Link
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Branding & Tips */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-violet-600 via-purple-600 to-violet-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-white/5 rounded-full" />

        {/* Logo & Brand */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-7 h-7 text-violet-600" />
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
              Create New Password
            </h1>
            <p className="text-white/80 text-lg max-w-md">
              You&apos;re almost there! Create a secure new password to protect
              your account and continue shopping.
            </p>
          </div>

          {/* Security Tips */}
          <div className="space-y-4">
            {tips.map((tip, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <tip.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{tip.title}</h3>
                  <p className="text-white/70 text-sm">{tip.description}</p>
                </div>
              </div>
            ))}
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
              <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Gadgets Kabila
              </span>
            </Link>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mb-2">
                <Lock className="w-7 h-7 text-violet-600" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Set New Password
              </CardTitle>
              <CardDescription>
                Create a strong password to secure your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">
                    Password Updated!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Your password has been successfully reset. Redirecting to
                    login...
                  </p>
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                      <span className="text-sm text-muted-foreground">
                        Redirecting in 3 seconds...
                      </span>
                    </div>
                    <Link href="/auth/login" className="block">
                      <Button
                        variant="outline"
                        className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white border-0"
                      >
                        Go to Login Now
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10 h-11"
                          placeholder="Enter new password"
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

                      {/* Password strength indicator */}
                      {password && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${passwordStrength.color}`}
                                style={{
                                  width: `${(passwordStrength.score / 6) * 100}%`,
                                }}
                              />
                            </div>
                            <span
                              className={`text-xs font-medium ${
                                passwordStrength.label === "Weak"
                                  ? "text-red-500"
                                  : passwordStrength.label === "Medium"
                                    ? "text-yellow-600"
                                    : "text-green-600"
                              }`}
                            >
                              {passwordStrength.label}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pr-10 h-11"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <X className="w-3 h-3" />
                          Passwords do not match
                        </p>
                      )}
                      {confirmPassword && password === confirmPassword && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Passwords match
                        </p>
                      )}
                    </div>

                    {/* Password requirements */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">
                        Password must have:
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {passwordRequirements.map((req, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-1.5 text-xs ${
                              req.met ? "text-green-600" : "text-gray-400"
                            }`}
                          >
                            {req.met ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            {req.text}
                          </div>
                        ))}
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-semibold bg-violet-600 hover:bg-violet-700"
                      disabled={isLoading || password !== confirmPassword}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Reset Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* Security note */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                  <Shield className="w-4 h-4" />
                  <span>Your password is encrypted and secure</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile tips */}
          <div className="mt-6 lg:hidden">
            <div className="grid grid-cols-3 gap-3">
              {tips.map((tip, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center text-center p-3 bg-white rounded-lg shadow-sm"
                >
                  <tip.icon className="w-5 h-5 text-violet-600 mb-1" />
                  <span className="text-xs text-muted-foreground">
                    {tip.title}
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
