import crypto from "crypto";

// Cashfree API Configuration
const rawCashfreeEnv = (
  process.env.CASHFREE_ENV ||
  process.env.NEXT_PUBLIC_CASHFREE_ENV ||
  (process.env.NODE_ENV === "production" ? "production" : "sandbox")
)
  .trim()
  .toLowerCase();

const CASHFREE_ENV =
  rawCashfreeEnv === "production" || rawCashfreeEnv === "prod"
    ? "production"
    : "sandbox";

const CASHFREE_API_BASE_URL =
  CASHFREE_ENV === "production"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID?.trim();
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY?.trim();

// Validate environment variables
if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
  console.warn(
    "Cashfree credentials not configured. Payment integration will not work.",
  );
}

function assertCashfreeCredentials() {
  if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
    throw new Error(
      "Cashfree credentials missing. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.",
    );
  }
}

function getCashfreeCredentials(): { appId: string; secretKey: string } {
  assertCashfreeCredentials();
  return {
    appId: CASHFREE_APP_ID as string,
    secretKey: CASHFREE_SECRET_KEY as string,
  };
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
  const { appId, secretKey } = getCashfreeCredentials();

  const headers: {
    "x-client-id": string;
    "x-client-secret": string;
    "x-api-version": string;
    "x-idempotency-key"?: string;
  } = {
    "x-client-id": appId,
    "x-client-secret": secretKey,
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

  console.log("[Cashfree] Creating order", {
    env: CASHFREE_ENV,
    baseUrl: CASHFREE_API_BASE_URL,
    endpoint,
    appIdPrefix: `${(headers["x-client-id"] || "").slice(0, 6)}***`,
  });

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
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || JSON.stringify(errorJson);
      } catch {
        // If response is not JSON, use the text as is
      }
      console.error("[Cashfree] Error Response Status:", response.status);
      console.error("[Cashfree] Error Response:", errorMessage);

      const authHint =
        response.status === 401
          ? ` | Check 1) CASHFREE_ENV/NEXT_PUBLIC_CASHFREE_ENV (${CASHFREE_ENV}) matches your key type, 2) CASHFREE_APP_ID and CASHFREE_SECRET_KEY are production keys for production URL, 3) no extra spaces/newlines in env values.`
          : "";

      throw new Error(
        `Cashfree API Error (${response.status}): ${errorMessage}${authHint}`,
      );
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
