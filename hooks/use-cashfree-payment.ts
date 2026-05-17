import { useState, useCallback } from "react";

interface CashfreePaymentConfig {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerPhone: string;
  customerName?: string;
}

interface CashfreeResponse {
  success: boolean;
  data?: {
    order_id: string;
    payment_link: string;
    cf_order_id?: number;
    order_status?: string;
  };
  error?: string;
}

export function useCashfreePayment() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initiate Cashfree payment
   */
  const initiatePayment = useCallback(
    async (config: CashfreePaymentConfig): Promise<CashfreeResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Create order via API
        const response = await fetch("/api/cashfree/initiate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: config.orderId,
            amount: config.amount,
            customer_phone: config.customerPhone,
            customer_name: config.customerName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to initiate payment");
        }

        const data: CashfreeResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Payment initiation failed");
        }

        // Step 2: Load Cashfree script
        await loadCashfreeScript();

        // Step 3: Initialize Cashfree SDK
        const Cashfree = (window as any).Cashfree;
        if (!Cashfree) {
          throw new Error("Cashfree SDK not loaded");
        }

        // Initialize Cashfree
        const cashfreeInstance = Cashfree({
          mode:
            process.env.NEXT_PUBLIC_CASHFREE_ENV === "production"
              ? "production"
              : "sandbox",
        });

        // Step 4: Get payment session ID
        const sessionId = (data.data as any)?.payment_session_id;
        if (!sessionId) {
          throw new Error("No payment session ID received from server");
        }

        // Step 5: Redirect to Cashfree hosted payment page in the same tab.
        // Using "_self" ensures Cashfree navigates back to return_url with
        // order_id/order_status appended, which the /checkout/payment-callback
        // page relies on. With "_modal" Cashfree never redirects and the
        // user is left stranded on /checkout.
        const checkoutOptions = {
          paymentSessionId: sessionId,
          redirectTarget: "_self",
        };

        // checkout() with _self triggers a full-page navigation, so the
        // promise typically never resolves; we still await it for safety.
        await cashfreeInstance.checkout(checkoutOptions);
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Cashfree payment error:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Check payment status
   */
  const checkPaymentStatus = useCallback(async (orderId: string) => {
    try {
      const response = await fetch(
        `/api/cashfree/webhook?order_id=${orderId}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch payment status");
      }

      return await response.json();
    } catch (err) {
      console.error("Error checking payment status:", err);
      throw err;
    }
  }, []);

  return {
    initiatePayment,
    checkPaymentStatus,
    isLoading,
    error,
  };
}

/**
 * Load Cashfree script dynamically
 */
function loadCashfreeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (typeof (window as any).Cashfree !== "undefined") {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
    document.head.appendChild(script);
  });
}
