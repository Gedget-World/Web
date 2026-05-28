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
  endpoint: string,
  body: string,
): {
  "x-client-id": string;
  "x-client-secret": string;
  "x-api-version": string;
  "x-idempotency-key"?: string;
} {
  const headers: any = {
    "x-client-id": CASHFREE_APP_ID!,
    "x-client-secret": CASHFREE_SECRET_KEY!,
    "x-api-version": "2023-08-01",
  };

  // Add idempotency key for POST requests to prevent duplicate processing
  if (body && (endpoint.includes("/orders") || endpoint.includes("/refunds"))) {
    headers["x-idempotency-key"] = crypto.randomUUID();
  }

  return headers;
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
 * Normalize phone number by removing spaces, hyphens, and parentheses.
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.trim().replace(/[\s()-]/g, "");
}

/**
 * Validate phone format accepted by Cashfree.
 * Examples: +919090407368, 9090407368, +16014635923
 */
export function isValidCashfreePhoneNumber(phone: string): boolean {
  const normalizedPhone = normalizePhoneNumber(phone);
  return /^(\+\d{10,15}|\d{10,15})$/.test(normalizedPhone);
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
  const normalizedPhone = normalizePhoneNumber(paymentData.customer_phone);

  if (!isValidCashfreePhoneNumber(normalizedPhone)) {
    throw new Error(
      "Invalid customer phone number. Use a valid format like +919090407368 or 9090407368.",
    );
  }

  const requestBody = {
    order_id: paymentData.order_id,
    order_amount: paymentData.amount,
    order_currency: paymentData.currency || "INR",
    customer_details: {
      customer_id: paymentData.order_id,
      customer_email: paymentData.customer_email,
      customer_phone: normalizedPhone,
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
