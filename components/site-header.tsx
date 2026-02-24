"use client";

import Link from "next/link";
import { User, LogOut, Package, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartButton } from "@/components/cart-button";
import { GlobalSearch } from "@/components/global-search";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="text-sm text-center text-white bg-black py-1">
        Development
      </div>
      <div className="container flex h-16 items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-slate-900">
            Gadgets Kabila
          </span>
        </Link>

        <div className="flex-1 max-w-md mx-4">
          <GlobalSearch />
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/products"
            className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            Products
          </Link>
          <Link
            href="/collections"
            className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            Collections
          </Link>
          <Link
            href="/deals"
            className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            Deals
          </Link>
          <Link
            href="/new-arrivals"
            className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            New Arrivals
          </Link>
          <Link
            href="/bestsellers"
            className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            Bestsellers
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <CartButton />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Account menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex items-center cursor-pointer"
                  >
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/orders"
                    className="flex items-center cursor-pointer"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/auth/login">
                <User className="h-5 w-5" />
                <span className="sr-only">Account</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
