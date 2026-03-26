import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import "../../../../globals.css";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Gadgets Kabila - Your Ultimate Tech Destination",
  description:
    "Discover the latest in tech at Gadgets Kabila. From smartphones to smart home devices, we offer a wide range of gadgets to enhance your lifestyle. Shop now for the best deals and cutting-edge technology.",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <AdminHeader />
          {children}
        </main>
      </SidebarProvider>
    </AdminAuthGuard>
  );
}
