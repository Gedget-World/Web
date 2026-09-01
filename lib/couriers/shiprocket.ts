import "server-only";
import {
  CourierAdapter,
  InvalidTrackingIdError,
  ShipmentStatus,
  TrackingResult,
} from "./types";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

function getAuthToken(): string {
  const token = process.env.SHIPROCKET_API_TOKEN;
  if (!token) {
    throw new Error(
      "Shiprocket is not configured: missing SHIPROCKET_API_TOKEN environment variable.",
    );
  }
  return token;
}

// Maps Shiprocket's free-text `current_status` to our normalized shipment_status enum.
function mapCurrentStatus(currentStatus: string): ShipmentStatus {
  const s = currentStatus.trim().toLowerCase();

  if (s.includes("delivered") && !s.includes("rto")) return "delivered";
  if (s.includes("rto") && (s.includes("delivered") || s.includes("complete")))
    return "rto_delivered";
  if (s.includes("rto")) return "rto_initiated";
  if (s.includes("out for delivery")) return "out_for_delivery";
  if (
    s.includes("undelivered") ||
    s.includes("delivery failed") ||
    s.includes("failed delivery")
  )
    return "delivery_failed";
  if (s.includes("lost")) return "lost";
  if (s.includes("damaged")) return "damaged";
  if (s.includes("cancel")) return "cancelled";
  if (
    s.includes("in transit") ||
    s.includes("shipped") ||
    s.includes("in-transit")
  )
    return "in_transit";
  if (s.includes("picked up") || s.includes("pickup complete"))
    return "picked_up";
  if (s.includes("pickup") && s.includes("schedul")) return "pickup_scheduled";
  if (s.includes("manifest") || s.includes("label")) return "label_created";

  // Unknown/new Shiprocket status text — default to the safest "in progress" bucket.
  return "in_transit";
}

export const shiprocketAdapter: CourierAdapter = {
  async track(trackingNumber: string): Promise<TrackingResult> {
    const token = getAuthToken();

    const res = await fetch(
      `${SHIPROCKET_BASE_URL}/courier/track/awb/${encodeURIComponent(trackingNumber)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Shiprocket authentication failed — SHIPROCKET_API_TOKEN may be expired/invalid.",
      );
    }
    if (!res.ok) {
      throw new InvalidTrackingIdError("Shiprocket");
    }

    const data = await res.json();
    const trackingData = data?.tracking_data;
    const shipmentTrack = trackingData?.shipment_track;
    const currentStatus: string | undefined = Array.isArray(shipmentTrack)
      ? shipmentTrack[0]?.current_status
      : undefined;

    if (!trackingData || trackingData.error || !currentStatus) {
      throw new InvalidTrackingIdError("Shiprocket");
    }

    return {
      shipmentStatus: mapCurrentStatus(currentStatus),
      rawStatus: currentStatus,
      courierName: shipmentTrack?.[0]?.courier_name,
    };
  },
};
