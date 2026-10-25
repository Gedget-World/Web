"use client";

import type React from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock3,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminSession, type AdminSession } from "@/hooks/use-admin-session";
import BASE_LOGO from "@/content/assets/logo/base-logo.png";

type Step = "email" | "otp" | "password";

export default function AdminForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { saveSession } = useAdminSession();

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to request a reset code.");
      }

      setStep("otp");
      setMessage(
        "If an admin account exists for that email, a 6-digit code will arrive shortly. It expires in 2 minutes.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to request a reset code.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to verify the code.");
      }

      setResetToken(result.resetToken);
      setStep("password");
      setMessage("Code verified. Choose a new password.");
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "Unable to verify the code.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetToken, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to reset the password.");
      }

      const session = result.data as AdminSession;
      saveSession(session);
      if (session.is_verified && !session.is_locked) {
        router.push("/admin/dashboard");
      } else {
        router.push("/admin");
      }
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Unable to reset the password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

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
              <Image
                src={BASE_LOGO}
                alt="Gadgets Kabila"
                className="h-full w-full object-contain"
                priority
              />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">
                Gadgets Kabila
              </span>
              <span className="mt-1 block text-xs font-medium uppercase tracking-[0.2em] text-blue-100/75">
                Admin portal
              </span>
            </span>
          </Link>

          <div className="relative max-w-md pb-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50">
              <ShieldCheck className="h-4 w-4 text-amber-300" />
              Secure account recovery
            </div>
            <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl">
              A fresh start,
              <br />
              <span className="text-amber-300">without the worry.</span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-blue-100/75">
              Get back to managing your store with a quick, secure password
              reset. Your account and sessions stay protected every step of the
              way.
            </p>

            <div className="mt-10 space-y-5">
              {[
                "A one-time code sent to your admin email",
                "Verification code expires in 2 minutes",
                "Existing sessions are signed out after reset",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-blue-50/90">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber-300">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-blue-100/50">
            © {new Date().getFullYear()} Gadgets Kabila. All rights reserved.
          </p>
        </aside>

        <section className="flex flex-col justify-center px-6 py-8 sm:px-12 lg:px-16 lg:py-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white p-0.5 shadow-sm ring-1 ring-slate-200">
                <Image
                  src={BASE_LOGO}
                  alt="Gadgets Kabila"
                  className="h-full w-full object-contain"
                  priority
                />
              </span>
              <span>
                <span className="block font-bold tracking-tight text-slate-900">
                  Gadgets Kabila
                </span>
                <span className="text-xs text-slate-500">Admin portal</span>
              </span>
            </div>

            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                {step === "email" && <Mail className="h-5 w-5" />}
                {step === "otp" && <KeyRound className="h-5 w-5" />}
                {step === "password" && <LockKeyhole className="h-5 w-5" />}
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
                Admin account recovery
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.1rem]">
                {step === "email" && "Forgot your password?"}
                {step === "otp" && "Check your inbox"}
                {step === "password" && "Create a new password"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {step === "email" &&
                  "No problem. Enter the email linked to your admin account and we'll send you a secure reset code."}
                {step === "otp" &&
                  `Enter the 6-digit verification code sent to ${email}.`}
                {step === "password" &&
                  "Your code is verified. Choose a strong password you haven't used before."}
              </p>
            </div>

            <div className="mb-8 grid grid-cols-3 gap-2" aria-label="Reset progress">
              {[
                { title: "Email", active: true },
                { title: "Verify", active: step !== "email" },
                { title: "Reset", active: step === "password" },
              ].map((item, index) => (
                <div key={item.title}>
                  <div
                    className={`mb-2 h-1 rounded-full ${
                      item.active ? "bg-amber-500" : "bg-slate-100"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-medium ${
                      item.active ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    0{index + 1} · {item.title}
                  </span>
                </div>
              ))}
            </div>

            {step === "email" && (
              <form onSubmit={submitRequest} className="flex flex-col gap-5">
                <div className="grid gap-2.5">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                    Admin email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/60 px-4 placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-amber-500/30"
                  />
                  <p className="text-xs text-slate-400">
                    Use the email address associated with your admin account.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-[#102b49] font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#183c62]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {isLoading ? "Sending code..." : "Send reset code"}
                </Button>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={verifyOtp} className="flex flex-col gap-5">
                <div className="grid gap-2.5">
                  <Label htmlFor="otp" className="text-sm font-semibold text-slate-700">
                    6-digit verification code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    className="h-14 rounded-xl border-slate-200 bg-slate-50/60 text-center font-mono text-2xl tracking-[0.5em] placeholder:tracking-[0.5em] focus-visible:bg-white focus-visible:ring-amber-500/30"
                  />
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    Your code expires in 2 minutes.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-[#102b49] font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#183c62]"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Verify code
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 text-slate-500 hover:text-slate-900"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setMessage("");
                    setError("");
                  }}
                >
                  Use a different email
                </Button>
              </form>
            )}

            {step === "password" && (
              <form onSubmit={resetPassword} className="flex flex-col gap-5">
                <div className="grid gap-2.5">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    New password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/60 px-4 focus-visible:bg-white focus-visible:ring-amber-500/30"
                  />
                </div>
                <div className="grid gap-2.5">
                  <Label htmlFor="confirm-password" className="text-sm font-semibold text-slate-700">
                    Confirm new password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Enter your new password again"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/60 px-4 focus-visible:bg-white focus-visible:ring-amber-500/30"
                  />
                </div>
                <p className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                  Use at least 8 characters to keep your account secure.
                </p>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-[#102b49] font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#183c62]"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update password
                </Button>
              </form>
            )}

            {message && (
              <p
                role="status"
                className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-800"
              >
                {message}
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
              >
                {error}
              </p>
            )}

            <div className="mt-8 border-t border-slate-100 pt-6">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to admin login
              </Link>
              <p className="mt-5 text-xs leading-5 text-slate-400">
                Need help accessing your account? Contact your store
                administrator.
              </p>
            </div>
          </div>
          <p className="mt-10 text-center text-[11px] text-slate-400 lg:hidden">
            © {new Date().getFullYear()} Gadgets Kabila
          </p>
        </section>
      </div>
    </main>
  );
}