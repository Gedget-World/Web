"use client";

import type React from "react";
import { Suspense } from "react";
import Image from "next/image";
import BASE_LOGO from "@/content/assets/logo/base-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAdminSession, type AdminSession } from "@/hooks/use-admin-session";
import { triggerNavigationProgress } from "@/components/navigation-progress";

function AdminLoginContent() {
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
    validateSession,
  } = useAdminSession();

  // Check for unauthorized redirect
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setError("Please login to access the admin dashboard");
    }
  }, [searchParams]);

  // Validate session and redirect to dashboard if valid
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (sessionLoading) return;

      if (admin && isAllowed) {
        // Validate session with server before redirecting
        const isValid = await validateSession();
        if (isValid) {
          triggerNavigationProgress();
          router.push("/admin/dashboard");
        }
        // If not valid, session is cleared by validateSession, user stays on login
      }
    };

    checkAndRedirect();
  }, [admin, sessionLoading, isAllowed, router, validateSession]);

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
        triggerNavigationProgress();
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
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f5f7fb]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f7fb] px-4 py-8 sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute -left-36 -top-40 h-96 w-96 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-44 -right-20 h-[28rem] w-[28rem] rounded-full bg-blue-200/30 blur-3xl" />
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_30px_100px_-35px_rgba(15,23,42,0.3)] lg:min-h-[680px] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#102b49] px-12 py-10 text-white lg:flex">
          <div className="absolute -right-24 top-12 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-12 top-24 h-56 w-56 rounded-full border border-white/10" />
          <div className="absolute -bottom-36 -left-32 h-96 w-96 rounded-full bg-[#f59e0b]/15 blur-2xl" />
          <Link href="/admin" className="relative flex items-center gap-4">
            <span className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-white p-1 shadow-lg shadow-black/10">
              <Image src={BASE_LOGO} alt="Gadgets Kabila" className="h-full w-full object-contain" priority />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">Gadgets Kabila</span>
              <span className="mt-1 block text-xs font-medium uppercase tracking-[0.2em] text-blue-100/75">Admin portal</span>
            </span>
          </Link>
          <div className="relative max-w-md pb-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50">
              <ShieldCheck className="h-4 w-4 text-amber-300" />
              Your store, at a glance
            </div>
            <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl">
              Welcome back,
              <br />
              <span className="text-amber-300">let’s get to work.</span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-blue-100/75">
              Sign in to manage your store, keep orders moving, and give your
              customers a great experience.
            </p>
            <div className="mt-10 space-y-5">
              {["Manage products and collections", "Track orders and customer activity", "Keep your store running smoothly"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-blue-50/90">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber-300">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <p className="relative text-xs text-blue-100/50">© {new Date().getFullYear()} Gadgets Kabila. All rights reserved.</p>
        </aside>

        <section className="flex flex-col justify-center px-6 py-8 sm:px-12 lg:px-16 lg:py-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-0.5 shadow-sm ring-1 ring-slate-200">
                <Image src={BASE_LOGO} alt="Gadgets Kabila" className="h-full w-full object-contain" priority />
              </span>
              <span>
                <span className="block font-bold tracking-tight text-slate-900">Gadgets Kabila</span>
                <span className="text-xs text-slate-500">Admin portal</span>
              </span>
            </div>

            {isLocked ? (
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
                <Lock className="h-5 w-5" />
              </div>
            ) : isNotVerified ? (
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <ShieldAlert className="h-5 w-5" />
              </div>
            ) : (
              <div className="mb-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                  <Lock className="h-5 w-5" />
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Admin sign in</p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.1rem]">Welcome back</h2>
                <p className="mt-3 text-sm leading-6 text-slate-500">Sign in with your admin credentials to continue to your dashboard.</p>
              </div>
            )}

            {isLocked ? (
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Account security</p>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Account locked</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">Your account has been locked after too many failed sign-in attempts. Contact a system administrator to regain access.</p>
                </div>
                <Button variant="outline" className="h-12 w-full rounded-xl" onClick={resetState}>Back to login</Button>
              </div>
            ) : isNotVerified ? (
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Account approval</p>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Verification pending</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500">Your admin account is awaiting approval by a super admin. You’ll be able to access the dashboard once it’s approved.</p>
                </div>
                <Button variant="outline" className="h-12 w-full rounded-xl" onClick={resetState}>Back to login</Button>
              </div>
            ) : (
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-5">
                  <div className="grid gap-2.5">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email address</Label>
                    <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl border-slate-200 bg-slate-50/60 px-4 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-amber-500/30" />
                  </div>
                  <div className="grid gap-2.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                      <Link href="/admin/forgot-password" className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline">Forgot password?</Link>
                    </div>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl border-slate-200 bg-slate-50/60 px-4 pr-11 focus-visible:bg-white focus-visible:ring-amber-500/30" />
                      <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                  <Button type="submit" className="h-12 w-full rounded-xl bg-[#102b49] font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#183c62]" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
                    {isLoading ? "Signing in..." : ""}
                  </Button>
                </div>
                <div className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
                  New to the admin team?{" "}
                  <Link href="/admin/register" className="font-semibold text-amber-700 hover:text-amber-800 hover:underline">Create an account</Link>
                </div>
              </form>
            )}
            <p className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Mail className="h-3.5 w-3.5" />
              Need access? Contact your store administrator.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminLogin() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-[#f5f7fb]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
