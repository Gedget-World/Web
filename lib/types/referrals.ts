// Referral / Affiliate marketing system types

export type AffiliateStatus = "pending" | "approved" | "rejected" | "suspended";
export type PayoutMethod = "bank_transfer" | "upi";
export type CommissionStatus =
  | "pending"
  | "confirmed"
  | "reversed"
  | "ineligible_self_referral"
  | "paid";
export type PayoutStatus = "pending" | "processing" | "paid" | "failed";

export interface PayoutDetails {
  // bank_transfer
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  // upi
  upi_id?: string;
}

export interface Affiliate {
  id: string;
  customer_id: string;
  user_id: string;
  status: AffiliateStatus;
  referral_code: string | null;
  application_message: string | null;
  payout_method: PayoutMethod | null;
  payout_details: PayoutDetails;
  rejected_reason: string | null;
  approved_at: string | null;
  approved_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralLink {
  id: string;
  affiliate_id: string;
  product_id: string;
  link_code: string;
  clicks_count: number;
  created_at: string;
}

export interface ReferralCommission {
  id: string;
  referral_link_id: string;
  affiliate_id: string;
  order_id: string;
  order_item_id: string | null;
  product_id: string;
  buyer_customer_id: string | null;
  commission_rate: number;
  line_item_amount: number;
  commission_amount: number;
  status: CommissionStatus;
  needs_clawback: boolean;
  confirmed_at: string | null;
  reversed_at: string | null;
  reversed_reason: string | null;
  payout_id: string | null;
  created_at: string;
}

export interface CommissionPayout {
  id: string;
  affiliate_id: string;
  total_amount: number;
  status: PayoutStatus;
  payout_method: string | null;
  payout_reference: string | null;
  notes: string | null;
  paid_at: string | null;
  created_by_admin_id: string | null;
  created_at: string;
}

// Attribution click record stashed in the signed `_ref_attr` cookie.
export interface ReferralAttributionClick {
  linkCode: string;
  productId: string;
  affiliateId: string;
  clickedAt: number; // epoch ms
}
