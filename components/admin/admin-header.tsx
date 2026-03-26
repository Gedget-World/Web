"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User, ShieldCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/hooks/use-admin-session";

export function AdminHeader() {
  const router = useRouter();
  const { admin, logout, isLoading } = useAdminSession();

  const handleLogout = async () => {
    await logout();
  };

  // Get initials from admin name or email
  const getInitials = () => {
    if (admin?.name) {
      return admin.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (admin?.email) {
      return admin.email[0].toUpperCase();
    }
    return "A";
  };

  return (
    <header className="flex items-center justify-between px-3 py-2 border-b">
      <SidebarTrigger />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src="" alt={admin?.name || "Admin"} />
              <AvatarFallback className="bg-blue-600 text-white text-xs">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  getInitials()
                )}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">
                {admin?.name || "Admin User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {admin?.email || "admin@example.com"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/admin/dashboard/profile")}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/admin/dashboard/settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
