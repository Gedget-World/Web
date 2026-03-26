"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/hooks/use-admin-session";
import { Loader2, ShieldCheck } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const { admin, isLoading, validateSession, logout } = useAdminSession();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Redirect if not logged in
    if (!isLoading && !admin) {
      router.push("/admin");
      return;
    }

    // If admin is verified, redirect to dashboard
    if (!isLoading && admin?.is_verified) {
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
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <ShieldCheck className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                Verification Pending
              </h2>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Status:</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-amber-600">
                    Awaiting Approval
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Your admin account is awaiting verification by a super admin. You
              will be able to access the dashboard once your account is
              approved.
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleCheckStatus}
                className="w-full"
                disabled={isChecking}
              >
                {isChecking && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isChecking ? "Checking..." : "Check Verification Status"}
              </Button>
              <Button variant="outline" onClick={logout} className="w-full">
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
