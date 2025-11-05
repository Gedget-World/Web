import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Sidebar from "@/components/admin/sidebar";

import "../../../../(site)/globals.css";

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
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="font-sans">
        {/* <div>Admin Dashboard {children}</div> */}
        <div className="w-full h-screen">
          <div className="w-full border-b border-gray-300 py-3 px-4 flex justify-between items-center">
            <div>Logo</div>
            <div>
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
          </div>
          <div className="w-full flex flex-row gap-1 h-[calc(100vh-56px)]">
            <div className="w-[260px] bg-[#F0F0F0]">
              <Sidebar />
            </div>
            <div className="w-full bg-gray-300">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
