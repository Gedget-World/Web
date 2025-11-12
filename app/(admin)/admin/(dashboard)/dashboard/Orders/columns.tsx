// app/dashboard/users/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "customer_name",
    header: "Customer Name",
  },
  {
    accessorKey: "tracking_number",
    header: "Tracking Number",
  },

  {
    accessorKey: "invoice_number",
    header: "Invoice Number",
  },
  {
    accessorKey: "total",
    header: "Total",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];

// coupon_code: null;
// created_at: "2025-10-30T17:15:24.597586+00:00";
// customer_email: null;
// customer_name: null;
// discount_amount: 0;
// id: "bca2a4d3-abc5-4c3d-877e-341cc5928d94";
// invoice_date: "2025-11-08T11:04:21.545614";
// invoice_number: null;
// invoice_url: null;
// is_returnable: false;
// refund_processed: false;
// refund_processed_at: null;
// return_approved: false;
// return_processed_at: null;
// return_reason: null;
// return_requested: false;
// return_requested_at: null;
// return_window: 0;
// shipping_address: null;
// shipping_city: null;
// shipping_country: null;
// shipping_postal_code: null;
// status: "pending";
// total: 39.99;
// tracking_number: null;
// updated_at: "2025-10-30T17:15:24.597586+00:00";
// user_id: "075a7088-3fad-4797-8fd5-0382f601af29";
