import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import "../../../../globals.css";

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
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <SidebarTrigger className="ml-3 mt-2" />
        {children}
      </main>
    </SidebarProvider>
  );
}
