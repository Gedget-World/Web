"use client";

import type React from "react";

import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState(false);

  useEffect(() => {
    const adminData = sessionStorage.getItem("admin");
    async function checkVerificationStatus(adminDataVal: string | null) {
      let admin: any = null;
      if (adminDataVal) {
        admin = JSON.parse(adminDataVal);
      }
      if (admin === null) {
        router.push("/admin");
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("admins")
        .select("is_verified")
        .eq("id", admin[0].id)
        .single();
      if (data && data.is_verified) {
        router.push("/admin/dashboard");
      } else {
        setStatus(false);
      }
    }

    checkVerificationStatus(adminData);
  }, []);

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardContent>
            <h2 className="text-2xl mb-3 flex flex-row items-center gap-2">
              <div>Verification is pending </div>
              {status ? (
                <div className="w-3 h-3 bg-green-600 rounded-xl mt-2"></div>
              ) : (
                <div className="w-3 h-3 bg-red-600 rounded-xl mt-2"></div>
              )}
            </h2>
            <p className="text-sm text-gray-500">
              Please contact the system administrator to verify your account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
