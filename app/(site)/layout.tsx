import type React from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import Footer from "@/components/site-footer";
import { FirstLoadHandler } from "@/components/first-load-handler";
import { NavigationProgressWrapper } from "@/components/navigation-progress-wrapper";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = {
  title: "Gadgets Kabila - Your Ultimate Tech Destination",
  description:
    "Discover the latest in tech at Gadgets Kabila. From daily life to smart home devices to gifts for your special ones, you have all under one roof. We offer a wide range of gadgets to enhance your lifestyle.",
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavigationProgressWrapper />
      <FirstLoadHandler />
      <SiteHeader />
      <PageTransition>{children}</PageTransition>
      <Footer />
    </>
  );
}
