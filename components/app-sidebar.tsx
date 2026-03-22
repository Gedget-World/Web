"use client";

import {
  ClockArrowUp,
  ShoppingBasket,
  Boxes,
  Home,
  Newspaper,
  Gift,
  Users,
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
    title: "Coupons",
    url: `${baseURI}/Coupons`,
    icon: Gift,
  },
  {
    title: "Customers",
    url: `${baseURI}/Customers`,
    icon: Users,
  },
  {
    title: "Reviews",
    url: `${baseURI}/Reviews`,
    icon: Newspaper,
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
