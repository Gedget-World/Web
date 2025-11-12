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
    accessorKey: "slug",
    header: "Slug",
  },
  {
    accessorKey: "is_active",
    header: "Active",
  },
];

// created_at: "2025-10-30T17:10:22.788537+00:00";
// description: "Fresh and vibrant styles for the sunny season";
// id: "bb1b037e-532a-4680-92cc-6d942725473c";
// image_url: "/placeholder.svg?height=400&width=600";
// is_active: true;
// is_featured: false;
// name: "Summer Collection";
// seo_description: null;
// seo_keywords: null;
// seo_title: null;
// slug: "summer-collection";
