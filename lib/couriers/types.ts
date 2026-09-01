// Shared types for the pluggable courier-tracking adapter system.
// One adapter per `orders.shipping_partner` value (matches the DB CHECK
// constraint in scripts/029_expand_order_status_and_shipment_tracking.sql).

export type ShippingPartner =
  | "shiprocket"
  | "truxcargo"
  | "envia"
  | "easyship"
  | "shipmozo"
  | "bigship";

// Matches orders.shipment_status CHECK constraint exactly.
export type ShipmentStatus =
  | "label_created"
  | "pickup_scheduled"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "delivery_failed"
  | "rto_initiated"
  | "rto_delivered"
  | "lost"
  | "damaged"
  | "cancelled";

export const SHIPPING_PARTNER_LABELS: Record<ShippingPartner, string> = {
  shiprocket: "Shiprocket",
  truxcargo: "TruxCargo",
  envia: "Envia",
  easyship: "EasyShip",
  shipmozo: "ShipMozo",
  bigship: "BigShip",
};

export interface TrackingResult {
  shipmentStatus: ShipmentStatus;
  rawStatus: string;
  courierName?: string;
}

export interface CourierAdapter {
  /** Resolves with the normalized status, or throws if the AWB/order ID is invalid/unverifiable. */
  track(trackingNumber: string): Promise<TrackingResult>;
}

// Thrown by adapters that don't have a real API integration wired up yet —
// callers should surface this as a blocking 400, never save/lock the order.
export class CourierNotConfiguredError extends Error {
  constructor(partnerLabel: string) {
    super(
      `${partnerLabel} tracking isn't integrated yet. Contact the developer to add API credentials for this courier.`,
    );
    this.name = "CourierNotConfiguredError";
  }
}

// Thrown when the courier's API responds but reports the AWB/order ID as invalid/unknown.
export class InvalidTrackingIdError extends Error {
  constructor(partnerLabel: string) {
    super(
      `${partnerLabel} could not find a shipment for this AWB/order ID. Please double-check and try again.`,
    );
    this.name = "InvalidTrackingIdError";
  }
}
