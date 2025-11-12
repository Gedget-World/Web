// app/dashboard/users/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "price",
    header: "Price",
  },
  {
    accessorKey: "stock",
    header: "Stock",
  },
  {
    accessorKey: "is_active",
    header: "Active",
  },
];

// collection_id: "a9e064bc-a81f-42f0-92ec-6247b0875e63";
// created_at: "2025-10-30T17:10:22.788537+00:00";
// description: "A timeless wardrobe essential made from premium cotton";
// discount_percentage: 20;
// id: "ac88b8cb-9232-458a-ae4b-7711f612e429";
// image_url: "/placeholder.svg?height=500&width=400";
// is_active: true;
// is_featured: true;
// is_new_arrival: true;
// name: "Classic White T-Shirt";
// price: 29.99;
// sales_count: 56;
// slug: "classic-white-tshirt";
// stock: 50;

// collection_id: "a9e064bc-a81f-42f0-92ec-6247b0875e63";
// created_at: "2025-10-30T17:10:22.788537+00:00";
// description: "A timeless wardrobe essential made from premium cotton"; -
// discount_percentage: 20; -
// id: "ac88b8cb-9232-458a-ae4b-7711f612e429";
// image_url: "/placeholder.svg?height=500&width=400";                      -- Thumbnail image
// is_active: true; -
// is_featured: true; -
// is_new_arrival: true; -
// name: "Classic White T-Shirt"; -
// price: 29.99; -
// sales_count: 56; -
// slug: "classic-white-tshirt"; -
// stock: 50; -
