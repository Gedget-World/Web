"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/hooks/use-admin-session";
import { Loader2 } from "lucide-react";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { admin, isLoading, isAllowed, validateSession } = useAdminSession();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading) {
        if (!admin) {
          router.push("/admin");
          return;
        }

        if (!isAllowed) {
          router.push("/admin/verify");
          return;
        }

        // Validate session with server periodically
        const isValid = await validateSession();
        if (!isValid) {
          router.push("/admin");
        }
      }
    };

    checkAuth();
  }, [admin, isLoading, isAllowed, validateSession, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!admin || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return <>{children}</>;
}
