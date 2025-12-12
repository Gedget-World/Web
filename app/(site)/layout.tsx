import type React from "react";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./../globals.css";
import { SiteHeader } from "@/components/site-header";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "StyleHub - Modern Fashion Store",
  description: "Discover timeless pieces that define modern elegance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable} antialiased`}>
      <body className="font-sans">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
