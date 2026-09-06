import "server-only";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import type { ReferralAttributionClick } from "@/lib/types/referrals";

// Server-only helpers for the referral/affiliate system: short code
// generation and the signed attribution cookie (prevents a user from
// forging `document.cookie` in devtools to redirect commission to an
// arbitrary affiliate — the HMAC signature is verified before trusting it).

export const REFERRAL_ATTRIBUTION_COOKIE = "_ref_attr";
const MAX_TRACKED_CLICKS = 50; // cap cookie size regardless of window/products browsed

function getCookieSecret(): string {
  const secret = process.env.REFERRAL_COOKIE_SECRET;
  if (!secret) {
    // Never block the request in dev, but this must be set in production —
    // remind via console rather than throwing, matching this repo's
    // fire-and-forget tolerance for non-critical config gaps.
    console.error(
      "[referrals] REFERRAL_COOKIE_SECRET is not set — attribution cookie signing is insecure.",
    );
    return "insecure-dev-fallback-secret";
  }
  return secret;
}

function randomCode(length: number): string {
  // Base36, uppercase, no dependency needed beyond Node's built-in crypto.
  return crypto
    .randomBytes(length)
    .toString("hex")
    .slice(0, length)
    .toUpperCase();
}

export function generateReferralCode(): string {
  return `AFF${randomCode(8)}`;
}

export function generateLinkCode(): string {
  return randomCode(10);
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getCookieSecret())
    .update(payload)
    .digest("base64url");
}

export function serializeAttributionCookie(
  clicks: ReferralAttributionClick[],
): string {
  const payload = JSON.stringify(clicks);
  const payloadB64 = Buffer.from(payload).toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function parseAttributionCookie(
  raw: string | undefined,
): ReferralAttributionClick[] {
  if (!raw) return [];
  const [payloadB64, signature] = raw.split(".");
  if (!payloadB64 || !signature) return [];
  if (sign(payloadB64) !== signature) return []; // tampered or signed with a rotated secret

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Dedupe to the most recent click per product, drop anything outside the
// attribution window, and cap the total list size.
export function mergeAttributionClick(
  existing: ReferralAttributionClick[],
  next: ReferralAttributionClick,
  windowDays: number,
): ReferralAttributionClick[] {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const merged = existing
    .filter((c) => c.productId !== next.productId && c.clickedAt >= cutoff)
    .concat(next);
  return merged.slice(-MAX_TRACKED_CLICKS);
}

export function findAttributedClick(
  clicks: ReferralAttributionClick[],
  productId: string,
  windowDays: number,
): ReferralAttributionClick | undefined {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  return clicks.find((c) => c.productId === productId && c.clickedAt >= cutoff);
}

interface OrderItemForAttribution {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
}

// Called from app/(site)/api/orders/route.ts right after order_items are
// inserted. Reads the signed attribution cookie, matches each purchased
// line item against a recent referral click for that same product, and
// records a pending commission — skipping (but still logging, as
// "ineligible_self_referral") purchases the affiliate made on their own link.
// Never throws — a broken referral attribution must never fail checkout.
export async function attributeReferralCommissions({
  orderId,
  buyerCustomerId,
  orderItems,
  attributionCookieValue,
}: {
  orderId: string;
  buyerCustomerId: string;
  orderItems: OrderItemForAttribution[];
  attributionCookieValue: string | undefined;
}): Promise<void> {
  try {
    const clicks = parseAttributionCookie(attributionCookieValue);
    if (clicks.length === 0) return;

    const service = createServiceClient();

    const { data: settingsRows } = await service
      .from("store_settings")
      .select("setting_key, setting_value")
      .in("setting_key", [
        "referral_program_enabled",
        "referral_commission_rate",
        "referral_attribution_window_days",
      ]);

    const settingsMap = Object.fromEntries(
      (settingsRows || []).map((s) => [s.setting_key, s.setting_value]),
    );
    if (settingsMap.referral_program_enabled === "false") return;

    const commissionRate = Number(settingsMap.referral_commission_rate) || 0;
    const windowDays =
      Number(settingsMap.referral_attribution_window_days) || 30;
    if (commissionRate <= 0) return;

    for (const item of orderItems) {
      const click = findAttributedClick(clicks, item.product_id, windowDays);
      if (!click) continue;

      const { data: link } = await service
        .from("referral_links")
        .select("id, affiliate_id, affiliates!inner(status, customer_id)")
        .eq("link_code", click.linkCode)
        .single();

      if (!link) continue;
      const affiliate = link.affiliates as unknown as {
        status: string;
        customer_id: string;
      };
      if (affiliate.status !== "approved") continue;

      const isSelfReferral = affiliate.customer_id === buyerCustomerId;
      const lineItemAmount = Math.round(item.price * item.quantity * 100) / 100;
      const commissionAmount = isSelfReferral
        ? 0
        : Math.round(lineItemAmount * (commissionRate / 100) * 100) / 100;

      await service.from("referral_commissions").upsert(
        {
          referral_link_id: link.id,
          affiliate_id: link.affiliate_id,
          order_id: orderId,
          order_item_id: item.id,
          product_id: item.product_id,
          buyer_customer_id: buyerCustomerId,
          commission_rate: commissionRate,
          line_item_amount: lineItemAmount,
          commission_amount: commissionAmount,
          status: isSelfReferral ? "ineligible_self_referral" : "pending",
        },
        {
          onConflict: "order_item_id,referral_link_id",
          ignoreDuplicates: true,
        },
      );
    }
  } catch (error) {
    console.error("[referrals] attributeReferralCommissions failed:", error);
  }
}
