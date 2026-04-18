import type React from "react";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Gadgets Kabila",
  description:
    "Discover the latest in tech at Gadgets Kabila. From daily life to smart home devices to gifts for your special ones, you have all under one roof. We offer a wide range of gadgets to enhance your lifestyle.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable} antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
