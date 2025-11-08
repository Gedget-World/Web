// app/dashboard/users/columns.tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";

export type UserData = {
  id: string;
  name: string;
  email: string;
};

export const columns: ColumnDef<UserData>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
];
