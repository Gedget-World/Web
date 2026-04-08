"use client";

import Link from "next/link";
import {
  User,
  LogOut,
  Package,
  UserCircle,
  Menu,
  Search,
  X,
  LogIn,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartButton } from "@/components/cart-button";
import { GlobalSearch } from "@/components/global-search";
import { CollectionsBar } from "@/components/collections-bar";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Collection = {
  name: string;
  slug: string;
};

export function SiteHeader() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Hide collections bar on these pages
  const hideCollectionsBar = [
    "/checkout",
    "/orders",
    "/policies",
    "/profile",
    "/contact-us",
    "/auth",
    "/about-us",
    "/checkout/success",
  ].some((path) => pathname.startsWith(path));

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    const fetchCollections = async () => {
      const { data } = await supabase
        .from("collections")
        .select("name, slug")
        .eq("is_active", true)
        .order("name", { ascending: true });
      setCollections(data || []);
    };
    fetchCollections();
  }, [supabase]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setIsLoggingOut(false);
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="container flex h-14 md:h-16 items-center px-4 md:px-8">
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <SheetHeader className="p-4 border-b shrink-0">
              <SheetTitle className="text-left text-xl font-bold">
                Gadgets Kabila
              </SheetTitle>
            </SheetHeader>

            {/* Collections List */}
            <div className="flex-1 overflow-y-auto py-4">
              <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Collections
              </h3>
              <div className="space-y-1">
                {collections.map((collection) => (
                  <Link
                    key={collection.slug}
                    href={`/products?collection=${collection.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    {collection.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* User Section */}
            <div className="border-t p-4 space-y-2 shrink-0 bg-white">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : user ? (
                <>
                  <div className="px-2 py-2 mb-2">
                    <p className="text-sm font-medium text-slate-900">
                      {user.user_metadata?.full_name ||
                        user.email?.split("@")[0] ||
                        "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                  >
                    <UserCircle className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-2 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                  >
                    <Package className="h-4 w-4" />
                    Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-accent rounded-md transition-colors text-red-600 disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Login
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <span className="text-xl md:text-2xl font-bold text-slate-900">
            Gadgets Kabila
          </span>
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 justify-center px-4">
          <div className="w-full max-w-md">
            <GlobalSearch />
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-1 md:gap-2 ml-auto">
          {/* Mobile Search Icon */}
          <div className="md:hidden">
            <GlobalSearch />
          </div>

          <CartButton />

          {/* Desktop User Menu */}
          <div className="hidden md:block">
            {isLoading ? (
              <Button variant="ghost" size="icon" disabled>
                <Loader2 className="h-5 w-5 animate-spin" />
              </Button>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Account menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-2 border-b mb-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {user.user_metadata?.full_name ||
                        user.email?.split("@")[0] ||
                        "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
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
                    disabled={isLoggingOut}
                    className="cursor-pointer"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/auth/login">
                  <LogIn className="h-5 w-5" />
                  <span className="sr-only">Login</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Collections Bar */}
      {!hideCollectionsBar && (
        <div className="hidden md:block">
          <CollectionsBar collections={collections} />
        </div>
      )}
    </header>
  );
}
