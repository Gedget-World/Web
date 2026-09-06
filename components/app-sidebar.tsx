"use client";

import {
  ClockArrowUp,
  ShoppingBasket,
  Boxes,
  Home,
  Newspaper,
  Gift,
  Users,
  ShieldCheck,
  Crown,
  KeyRound,
  Settings,
  BarChart3,
  MessageSquare,
  Star,
  LayoutTemplate,
  Handshake,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const baseURI = "/admin/dashboard";

// Menu items.
const items = [
  {
    title: "Home",
    url: `${baseURI}`,
    icon: Home,
  },
  {
    title: "Analytics",
    url: `${baseURI}/Analytics`,
    icon: BarChart3,
  },
  {
    title: "Products",
    url: `${baseURI}/Products`,
    icon: ShoppingBasket,
  },
  {
    title: "Collections",
    url: `${baseURI}/Collections`,
    icon: Boxes,
  },
  {
    title: "Orders",
    url: `${baseURI}/Orders`,
    icon: ClockArrowUp,
  },
  {
    title: "CMS",
    url: `${baseURI}/ContentManagement`,
    icon: Newspaper,
  },
  {
    title: "Admins",
    url: `${baseURI}/Admins`,
    icon: ShieldCheck,
  },
  {
    title: "Roles",
    url: `${baseURI}/Roles`,
    icon: Crown,
  },
  {
    title: "Permissions",
    url: `${baseURI}/Permissions`,
    icon: KeyRound,
  },
  {
    title: "Customers",
    url: `${baseURI}/Customers`,
    icon: Users,
  },
  {
    title: "Coupons",
    url: `${baseURI}/Coupons`,
    icon: Gift,
  },
  {
    title: "Affiliates",
    url: `${baseURI}/Affiliates`,
    icon: Handshake,
  },
  {
    title: "Reviews",
    url: `${baseURI}/Reviews`,
    icon: Star,
  },
  {
    title: "Queries",
    url: `${baseURI}/Queries`,
    icon: MessageSquare,
  },
  {
    title: "Manage Home Page",
    url: `${baseURI}/ManageHomePage`,
    icon: LayoutTemplate,
  },
  {
    title: "Settings",
    url: `${baseURI}/Settings`,
    icon: Settings,
  },

  // {
  //   title: "Policies",
  //   url: `${baseURI}/Policies`,
  //   icon: Newspaper,
  // },
];

export function AppSidebar() {
  const pathName = usePathname();
  const [path, setPath] = useState(pathName);
  useEffect(() => {
    setPath(pathName);
  }, [pathName]);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2">Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem
                  key={item.title}
                  className={path === item.url ? "bg-gray-200" : ""}
                >
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
