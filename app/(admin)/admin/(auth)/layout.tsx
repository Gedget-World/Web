import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "../../../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "StyleHub - Admin Dashboard",
  description: "Manage your store with our powerful admin dashboard",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
