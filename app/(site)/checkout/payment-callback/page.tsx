"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading",
  );
  const [message, setMessage] = useState("Processing your payment...");
  const [orderId, setOrderId] = useState<string | null>(null);

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
        if (statusParam === "PAID" || statusParam === "CAPTURED") {
          setStatus("success");
          setMessage("Payment successful! Your order is confirmed.");
          setTimeout(() => {
            router.push("/checkout/success");
          }, 2000);
        } else if (statusParam === "FAILED" || statusParam === "CANCELLED") {
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
          const cashfreeStatus = result.data?.order_status;

          if (cashfreeStatus === "PAID" || cashfreeStatus === "CAPTURED") {
            setStatus("success");
            setMessage("Payment successful! Your order is confirmed.");
            setTimeout(() => {
              router.push("/checkout/success");
            }, 2000);
          } else if (
            cashfreeStatus === "FAILED" ||
            cashfreeStatus === "CANCELLED"
          ) {
            setStatus("failed");
            setMessage("Payment failed. Please try again.");
          } else {
            setStatus("loading");
            setMessage("Verifying payment status...");
            // Retry after 2 seconds
            setTimeout(checkPaymentStatus, 2000);
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        setStatus("failed");
        setMessage(
          error instanceof Error
            ? error.message
            : "Error verifying payment. Please contact support.",
        );
      }
    };

    checkPaymentStatus();
  }, [searchParams, router]);

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
