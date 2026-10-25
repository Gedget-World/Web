"use client";

import Image from "next/image";
import Link from "next/link";
import BASE_LOGO from "@/content/assets/logo/base-logo.png";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/hooks/use-admin-session";
import {
  Check,
  Clock3,
  Loader2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { triggerNavigationProgress } from "@/components/navigation-progress";

export default function VerifyPage() {
  const router = useRouter();
  const { admin, isLoading, validateSession, logout } = useAdminSession();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Redirect if not logged in
    if (!isLoading && !admin) {
      triggerNavigationProgress();
      router.push("/admin");
      return;
    }

    // If admin is verified, redirect to dashboard
    if (!isLoading && admin?.is_verified) {
      triggerNavigationProgress();
      router.push("/admin/dashboard");
    }
  }, [admin, isLoading, router]);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const isValid = await validateSession();
      if (isValid) {
        // Re-check verification status from server
        const res = await fetch("/api/adminValidateSession", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_token: admin?.session_token }),
        });
        const data = await res.json();

        if (data.admin?.is_verified) {
          triggerNavigationProgress();
          router.push("/admin/dashboard");
        }
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  if (isLoading) {
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
              One final step
            </div>
            <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl">
              Access built on
              <br />
              <span className="text-amber-300">trust and security.</span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-blue-100/75">
              We review every admin account to help keep store operations and
              customer data protected.
            </p>
            <div className="mt-10 space-y-5">
              {[
                "Your registration has been received",
                "A super admin will review your account",
                "Dashboard access starts after approval",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-blue-50/90"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber-300">
                    {index === 0 ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                    )}
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

            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
              <Clock3 className="h-5 w-5" />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
              Account approval
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.1rem]">
              Verification pending
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Your admin account is awaiting review by a super admin. Once
              approved, you’ll be able to sign in and access the dashboard.
            </p>

            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-4">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Awaiting approval
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Your request is with the store administrator.
                </span>
              </span>
            </div>

            <div className="mt-7 space-y-3">
              <Button
                onClick={handleCheckStatus}
                className="h-12 w-full rounded-xl bg-[#102b49] font-semibold text-white shadow-lg shadow-blue-950/10 transition hover:bg-[#183c62]"
                disabled={isChecking}
              >
                {isChecking && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isChecking ? "Checking status..." : "Check approval status"}
              </Button>
              <Button
                variant="outline"
                onClick={logout}
                className="h-12 w-full rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>

            <p className="mt-7 text-center text-xs leading-5 text-slate-400">
              Questions about your access? Contact your store administrator.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
