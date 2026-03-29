import type React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login - Gadgets Kabila",
  description: "Manage your store with our powerful admin dashboard",
};

export default function AdminAuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
