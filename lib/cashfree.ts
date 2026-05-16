import crypto from "crypto";

// Cashfree API Configuration
const CASHFREE_API_BASE_URL =
  process.env.NEXT_PUBLIC_CASHFREE_ENV === "production"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

// Validate environment variables
if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
  console.warn(
    "Cashfree credentials not configured. Payment integration will not work.",
  );
}

/**
 * Generate authorization headers for Cashfree API v2023-08-01
 */
export function generateCashfreeAuthHeader(
  _endpoint: string,
  _body: string,
): {
  "x-client-id": string;
  "x-client-secret": string;
  "x-api-version": string;
} {
  return {
    "x-client-id": CASHFREE_APP_ID!,
    "x-client-secret": CASHFREE_SECRET_KEY!,
    "x-api-version": "2023-08-01",
  };
}

/**
 * Verify webhook signature from Cashfree
 */
export function verifyCashfreeWebhookSignature(
  body: Record<string, any>,
  signature: string,
): boolean {
  if (!CASHFREE_SECRET_KEY) return false;

  // Sort keys and create a string from the data
  const sortedKeys = Object.keys(body).sort();
  const dataString = sortedKeys.reduce((acc, key) => {
    return acc + String(body[key]);
  }, "");

  // Compute expected signature
  const expectedSignature = crypto
    .createHmac("sha256", CASHFREE_SECRET_KEY)
    .update(dataString)
    .digest("base64");

  return signature === expectedSignature;
}

/**
 * Create payment session with Cashfree
 */
export async function createCashfreePaymentSession(paymentData: {
  order_id: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  currency?: string;
  customer_name?: string;
}) {
  const endpoint = "/pg/orders";

  const requestBody = {
    order_id: paymentData.order_id,
    order_amount: paymentData.amount,
    order_currency: paymentData.currency || "INR",
    customer_details: {
      customer_id: paymentData.order_id,
      customer_email: paymentData.customer_email,
      customer_phone: paymentData.customer_phone,
      customer_name: paymentData.customer_name || "Customer",
    },
    order_meta: {
      return_url: `${(process.env.NEXT_PUBLIC_APP_URL || "").replace(/^http:\/\//, "https://")}/checkout/payment-callback`,
      notify_url: `${(process.env.NEXT_PUBLIC_APP_URL || "").replace(/^http:\/\//, "https://")}/api/cashfree/webhook`,
    },
  };

  const bodyString = JSON.stringify(requestBody);
  const headers = generateCashfreeAuthHeader(endpoint, bodyString);

  try {
    const response = await fetch(`${CASHFREE_API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: bodyString,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cashfree API Error: ${error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating Cashfree payment session:", error);
    throw error;
  }
}

/**
 * Fetch payment status from Cashfree
 */
export async function getCashfreePaymentStatus(orderId: string) {
  const endpoint = `/pg/orders/${orderId}`;

  const headers = generateCashfreeAuthHeader(endpoint, "");

  try {
    const response = await fetch(`${CASHFREE_API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cashfree API Error: ${error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching payment status from Cashfree:", error);
    throw error;
  }
}

/**
 * Refund a payment
 */
export async function refundCashfreePayment(
  orderId: string,
  refundAmount: number,
  refundId: string,
) {
  const endpoint = `/pg/orders/${orderId}/refunds`;

  const requestBody = {
    refund_id: refundId,
    refund_amount: refundAmount,
  };

  const bodyString = JSON.stringify(requestBody);
  const headers = generateCashfreeAuthHeader(endpoint, bodyString);

  try {
    const response = await fetch(`${CASHFREE_API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: bodyString,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cashfree API Error: ${error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error refunding payment:", error);
    throw error;
  }
}
