"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

const SUCCESS_STATUSES = new Set(["PAID", "CAPTURED", "SUCCESS", "CONFIRMED"]);
const FAILURE_STATUSES = new Set([
  "FAILED",
  "CANCELLED",
  "TERMINATED",
  "EXPIRED",
]);

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading",
  );
  const [message, setMessage] = useState("Processing your payment...");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const orderIdParam = searchParams.get("order_id");
        const statusParam = searchParams.get("order_status");

        if (!orderIdParam) {
          setStatus("failed");
          setMessage("Order ID not found. Please contact support.");
          return;
        }

        setOrderId(orderIdParam);

        // If we already have status from URL param
        if (SUCCESS_STATUSES.has((statusParam || "").toUpperCase())) {
          setStatus("success");
          setMessage("Payment successful! Your order is confirmed.");
          setTimeout(() => {
            router.push("/checkout/success");
          }, 2000);
        } else if (FAILURE_STATUSES.has((statusParam || "").toUpperCase())) {
          setStatus("failed");
          setMessage("Payment failed. Please try again or contact support.");
        } else {
          // Otherwise, check payment status from API
          const response = await fetch(
            `/api/cashfree/webhook?order_id=${orderIdParam}`,
          );

          if (!response.ok) {
            throw new Error("Failed to fetch payment status");
          }

          const result = await response.json();
          const cashfreeStatus = String(
            result.data?.order_status || "",
          ).toUpperCase();
          const internalStatus = String(
            result.data?.internal_order_status || result.data?.status || "",
          ).toUpperCase();

          if (
            SUCCESS_STATUSES.has(cashfreeStatus) ||
            SUCCESS_STATUSES.has(internalStatus)
          ) {
            setStatus("success");
            setMessage("Payment successful! Your order is confirmed.");
            setTimeout(() => {
              router.push("/checkout/success");
            }, 2000);
          } else if (
            FAILURE_STATUSES.has(cashfreeStatus) ||
            FAILURE_STATUSES.has(internalStatus)
          ) {
            setStatus("failed");
            setMessage("Payment failed. Please try again.");
          } else {
            setStatus("loading");
            setMessage("Verifying payment status...");
            // Retry with cap to avoid false failures during webhook/API delay.
            if (attempt < 8) {
              setTimeout(() => setAttempt((prev) => prev + 1), 2000);
            } else {
              setStatus("failed");
              setMessage(
                "We could not verify payment yet. Please check your Orders page; if debited, contact support.",
              );
            }
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        if (attempt < 8) {
          setStatus("loading");
          setMessage("Verifying payment status...");
          setTimeout(() => setAttempt((prev) => prev + 1), 2000);
        } else {
          setStatus("failed");
          setMessage(
            error instanceof Error
              ? error.message
              : "Error verifying payment. Please contact support.",
          );
        }
      }
    };

    checkPaymentStatus();
  }, [searchParams, router, attempt]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
              <p className="text-slate-600">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-600 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-slate-600 text-sm">{message}</p>
                {orderId && (
                  <p className="text-xs text-slate-500 mt-2">
                    Order ID: {orderId}
                  </p>
                )}
              </div>
              <Button
                onClick={() => router.push("/checkout/success")}
                className="w-full"
              >
                Continue to Orders
              </Button>
            </>
          )}

          {status === "failed" && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  Payment Failed
                </h3>
                <p className="text-slate-600 text-sm">{message}</p>
              </div>
              <div className="space-y-2 pt-4">
                <Button onClick={() => router.push("/cart")} className="w-full">
                  Return to Cart
                </Button>
                <Button
                  onClick={() => router.push("/checkout")}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            </>
          )}

          <p className="text-xs text-slate-400">
            If you don't see a redirect, please{" "}
            <Link href="/orders" className="text-blue-600 hover:underline">
              check your orders
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentCallbackFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="text-slate-600">Processing your payment...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<PaymentCallbackFallback />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
