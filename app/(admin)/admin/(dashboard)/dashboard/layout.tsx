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
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <SidebarTrigger className="ml-3 mt-2" />
        {children}
      </main>
    </SidebarProvider>
  );
}
