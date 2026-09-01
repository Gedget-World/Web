import "server-only";
import { shiprocketAdapter } from "./shiprocket";
import {
  CourierAdapter,
  CourierNotConfiguredError,
  ShipmentStatus,
  ShippingPartner,
  SHIPPING_PARTNER_LABELS,
} from "./types";

export * from "./types";

export function getCourierAdapter(partner: ShippingPartner): CourierAdapter {
  if (partner === "shiprocket") return shiprocketAdapter;

  // TruxCargo/Envia/EasyShip/ShipMozo/BigShip: not integrated yet — no
  // verified API docs/credentials for these. Throwing here blocks the
  // submission with a clear message instead of silently faking success.
  throw new CourierNotConfiguredError(SHIPPING_PARTNER_LABELS[partner]);
}

// Business-facing order.status lifecycle, in forward order (kept in sync
// with `statusFlow` in the admin order detail page).
const ORDER_STATUS_FLOW = [
  "pending",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;

const SHIPMENT_TO_ORDER_STATUS: Partial<Record<ShipmentStatus, string>> = {
  label_created: "packed",
  pickup_scheduled: "packed",
  picked_up: "shipped",
  in_transit: "shipped",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  rto_initiated: "rto",
  rto_delivered: "rto_received",
};

// Statuses order.status should never be auto-overwritten out of (cancelled,
// returns in progress, refunded, etc. are all admin/customer-driven, not courier-driven).
const NO_AUTO_ADVANCE_STATUSES = new Set([
  "cancelled",
  "payment_failed",
  "return_requested",
  "return_approved",
  "return_rejected",
  "return_in_transit",
  "returned",
  "rto",
  "rto_received",
  "refunded",
]);

/**
 * Given the order's current status and a freshly-fetched shipment status,
 * returns the new order.status to write, or null if it shouldn't change.
 * Never moves the linear pending->delivered flow backward.
 */
export function deriveOrderStatus(
  currentStatus: string,
  shipmentStatus: ShipmentStatus,
): string | null {
  if (NO_AUTO_ADVANCE_STATUSES.has(currentStatus)) return null;

  const target = SHIPMENT_TO_ORDER_STATUS[shipmentStatus];
  if (!target) return null;

  // RTO branch statuses aren't part of the linear flow — apply directly.
  if (target === "rto" || target === "rto_received") return target;

  const currentIndex = ORDER_STATUS_FLOW.indexOf(
    currentStatus as (typeof ORDER_STATUS_FLOW)[number],
  );
  const targetIndex = ORDER_STATUS_FLOW.indexOf(
    target as (typeof ORDER_STATUS_FLOW)[number],
  );
  if (targetIndex === -1) return null;
  if (currentIndex !== -1 && targetIndex <= currentIndex) return null;

  return target;
}
