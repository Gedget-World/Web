"use client";

import type React from "react";
import { Suspense, useEffect } from "react";
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
  ShieldCheck,
  UserRoundPlus,
  X,
} from "lucide-react";

import Link from "next/link";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useAdminSession } from "@/hooks/use-admin-session";
import { triggerNavigationProgress } from "@/components/navigation-progress";

// Password strength checker
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 4) return { score, label: "Medium", color: "bg-yellow-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

function AdminRegisterContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const {
    admin,
    isLoading: sessionLoading,
    isAllowed,
    validateSession,
  } = useAdminSession();

  // Validate session and redirect to dashboard if valid
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (sessionLoading) return;

      if (admin && isAllowed) {
        const isValid = await validateSession();
        if (isValid) {
          triggerNavigationProgress();
          router.push("/admin/dashboard");
        }
      }
    };

    checkAndRedirect();
  }, [admin, sessionLoading, isAllowed, router, validateSession]);

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password],
  );

  const passwordRequirements = useMemo(() => {
    return [
      { met: password.length >= 8, text: "At least 8 characters" },
      { met: /[a-z]/.test(password), text: "One lowercase letter" },
      { met: /[A-Z]/.test(password), text: "One uppercase letter" },
      { met: /[0-9]/.test(password), text: "One number" },
      {
        met: /[^a-zA-Z0-9]/.test(password),
        text: "One special character (optional)",
      },
    ];
  }, [password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/adminRegister", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (data.status === 201) {
        sessionStorage.setItem("admin", JSON.stringify(data.data));
        triggerNavigationProgress();
        router.push("/admin/verify");
      }
      if (data.status === 400) {
        setError(data.error || "Registration failed");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
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
      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_30px_100px_-35px_rgba(15,23,42,0.3)] lg:min-h-[740px] lg:grid-cols-[0.92fr_1.08fr]">
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
              Store team access
            </div>
            <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl">
              Good things
              <br />
              <span className="text-amber-300">start here.</span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-blue-100/75">
              Create your admin profile to request access to the Gadgets Kabila
              store dashboard.
            </p>
            <div className="mt-10 space-y-5">
              {["Set up your profile in just a few steps", "Choose a strong password for your account", "A super admin will review your access"].map((item) => (
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
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-0.5 shadow-sm ring-1 ring-slate-200">
                <Image src={BASE_LOGO} alt="Gadgets Kabila" className="h-full w-full object-contain" priority />
              </span>
              <span>
                <span className="block font-bold tracking-tight text-slate-900">Gadgets Kabila</span>
                <span className="text-xs text-slate-500">Admin portal</span>
              </span>
            </div>
            <div className="mb-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <UserRoundPlus className="h-5 w-5" />
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Create your profile</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.1rem]">Join the admin team</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">Enter your details to request an admin account. Access is available once your account is approved.</p>
            </div>
            <form onSubmit={handleRegister}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Full name</Label>
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-slate-50/60 px-4 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-amber-500/30"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 bg-slate-50/60 px-4 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-amber-500/30"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="h-11 rounded-xl border-slate-200 bg-slate-50/60 px-4 pr-11 focus-visible:bg-white focus-visible:ring-amber-500/30"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
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
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full ${
                                i <= passwordStrength.score
                                  ? passwordStrength.color
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p
                          className={`text-xs ${
                            passwordStrength.label === "Weak"
                              ? "text-red-600"
                              : passwordStrength.label === "Medium"
                                ? "text-amber-600"
                                : "text-emerald-600"
                          }`}
                        >
                          Password strength: {passwordStrength.label}
                        </p>
                        <ul className="space-y-1">
                          {passwordRequirements.slice(0, 4).map((req, i) => (
                            <li
                              key={i}
                              className={`flex items-center gap-1 text-xs ${
                                req.met ? "text-emerald-600" : "text-slate-500"
                              }`}
                            >
                              {req.met ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              {req.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Confirm password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className="h-11 rounded-xl border-slate-200 bg-slate-50/60 px-4 pr-11 focus-visible:bg-white focus-visible:ring-amber-500/30"
                      />
                      <button
                        type="button"
                        aria-label={
                          showConfirmPassword ? "Hide password" : "Show password"
                        }
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-600">
                        Passwords do not match
                      </p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="flex items-center gap-1 text-xs text-emerald-600">
                        <Check className="h-3 w-3" />
                        Passwords match
                      </p>
                    )}
                  </div>
                  {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                  <Button
                    type="submit"
                    className="h-11 w-full rounded-xl bg-[#102b49] font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#183c62]"
                    disabled={
                      isLoading ||
                      password.length < 8 ||
                      password !== confirmPassword
                    }
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isLoading ? "Creating account..." : <>Create account <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                </div>
                <div className="mt-7 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link href="/admin" className="font-semibold text-amber-700 hover:text-amber-800 hover:underline">Sign in</Link>
                </div>
              </form>
            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Your account is reviewed before dashboard access.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminRegister() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-[#f5f7fb]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      }
    >
      <AdminRegisterContent />
    </Suspense>
  );
}
