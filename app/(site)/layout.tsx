import type React from "react";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./../globals.css";
import { SiteHeader } from "@/components/site-header";
import Footer from "@/components/site-footer";
import { FirstLoadHandler } from "@/components/first-load-handler";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Gadgets Kabila - Your Ultimate Tech Destination",
  description:
    "Discover the latest in tech at Gadgets Kabila. From smartphones to smart home devices, we offer a wide range of gadgets to enhance your lifestyle. Shop now for the best deals and cutting-edge technology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable} antialiased`}>
      <body className="font-sans">
        <FirstLoadHandler />
        <SiteHeader />
        {children}
        <Footer />
      </body>
    </html>
  );
}
