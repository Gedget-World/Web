"use client";

import type React from "react";

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
import { Eye, EyeOff, Loader2, ShieldAlert, Lock } from "lucide-react";

import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAdminSession, type AdminSession } from "@/hooks/use-admin-session";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNotVerified, setIsNotVerified] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    admin,
    isLoading: sessionLoading,
    isAllowed,
    saveSession,
  } = useAdminSession();

  // Check for unauthorized redirect
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setError("Please login to access the admin dashboard");
    }
  }, [searchParams]);

  // Redirect to dashboard if already logged in and allowed
  useEffect(() => {
    if (!sessionLoading && admin && isAllowed) {
      router.push("/admin/dashboard");
    }
  }, [admin, sessionLoading, isAllowed, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setIsNotVerified(false);
    setIsLocked(false);

    try {
      const res = await fetch("/api/adminLogin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (data.status === 201) {
        const adminData = data.data as AdminSession;

        // Save session to client storage
        saveSession(adminData);

        // Check if admin is verified
        if (adminData.is_verified === false) {
          setIsNotVerified(true);
          return;
        }

        // Check if admin is locked
        if (adminData.is_locked === true) {
          setIsLocked(true);
          return;
        }

        // Redirect to dashboard
        router.push("/admin/dashboard");
      }

      if (data.status === 400) {
        // Check for specific error types
        if (data.error?.includes("locked")) {
          setIsLocked(true);
        } else {
          setError(data.error || "Login failed");
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setIsNotVerified(false);
    setIsLocked(false);
    setError(null);
  };

  // Show loading while checking existing session
  if (sessionLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          {isLocked ? (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <Lock className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl">Account Locked</CardTitle>
                <CardDescription>Your account has been locked</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your account has been locked due to too many failed login
                  attempts. Please contact a system administrator to unlock your
                  account.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={resetState}
                >
                  Back to Login
                </Button>
              </CardContent>
            </Card>
          ) : isNotVerified ? (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                  <ShieldAlert className="h-8 w-8 text-amber-600" />
                </div>
                <CardTitle className="text-2xl">Verification Pending</CardTitle>
                <CardDescription>
                  Your admin account is not yet verified
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Please wait for a super admin to verify your account. You will
                  be able to access the dashboard once your account is approved.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={resetState}
                >
                  Back to Login
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Admin Login</CardTitle>
                <CardDescription>
                  Enter your email below to login to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                          href="/admin/forgot-password"
                          className="text-sm text-muted-foreground hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </div>
                  <div className="mt-4 text-center text-sm">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/admin/register"
                      className="underline underline-offset-4"
                    >
                      Sign up
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
