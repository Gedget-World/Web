import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import "@/app/globals.css";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminAuthGuard } from "@/components/admin/admin-auth-guard";
import { NavigationProgressWrapper } from "@/components/navigation-progress-wrapper";
import DashboardLoading from "./loading";

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
      <NavigationProgressWrapper />
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full min-w-0">
          <AdminHeader />
          <Suspense fallback={<DashboardLoading />}>{children}</Suspense>
        </main>
      </SidebarProvider>
    </AdminAuthGuard>
  );
}
