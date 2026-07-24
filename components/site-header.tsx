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
  ShoppingBag,
  Truck,
  Phone,
  Heart,
  ChevronRight,
  Sparkles,
  Gift,
  Headphones,
  Smartphone,
  Watch,
  Laptop,
  Zap,
  HelpCircle,
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useCustomerStore, useCustomer } from "@/hooks/use-customer";
import { useWishlistStore } from "@/hooks/use-wishlist";
import Image from "next/image";
import BASE_LOGO from "@/content/assets/logo/base-logo.png";
import { BrandName } from "@/components/brand-name";

type Collection = {
  name: string;
  slug: string;
};

// Collection icons mapping
const collectionIcons: Record<string, React.ElementType> = {
  phones: Smartphone,
  audio: Headphones,
  watches: Watch,
  laptops: Laptop,
  accessories: Gift,
};

export function SiteHeader() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [greeting, setGreeting] = useState("");
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { customer, isHydrated, fetchCustomerData, isCacheValid } = useCustomer(
    user?.id,
  );
  const firstNameInitial = customer?.first_name?.trim()?.[0]?.toUpperCase();
  // No hardcoded "User" fallback here — if we don't actually know the
  // customer's name yet, just show nothing instead of a placeholder word.
  const displayName =
    customer?.first_name?.trim() ||
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email?.split("@")[0] ||
    "";
  const displayNameShort =
    customer?.first_name?.trim() ||
    (user?.user_metadata?.full_name as string | undefined)
      ?.trim()
      ?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "";

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

  // Fetch the customer profile (for the first-name avatar initial) once
  // we know who's logged in and the persisted cache has hydrated.
  useEffect(() => {
    if (!user?.id || !isHydrated) return;
    if (isCacheValid() && customer?.user_id === user.id) return;
    fetchCustomerData();
  }, [user?.id, isHydrated]);

  useEffect(() => {
    const fetchCollections = async () => {
      const { data } = await supabase
        .from("collections")
        .select("name, slug")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      setCollections(data || []);
    };
    fetchCollections();
  }, [supabase]);

  // Set greeting on client-side only to avoid hydration mismatch
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good morning");
    } else if (hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Clear cached customer data
    useCustomerStore.getState().clearCache();
    await supabase.auth.signOut();
    setIsLoggingOut(false);
    setMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Announcement Bar */}
      <div className="bg-linear-to-r from-primary via-primary/90 to-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
        <div className="container relative flex items-center justify-center gap-2 px-2 max-w-7xl mx-auto py-2 text-[11px] sm:text-xs md:text-sm">
          <div className="flex items-center gap-3 sm:gap-6 text-white whitespace-nowrap">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>
                <span>Free Shipping All Over India</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="font-medium">
                <span>Up-To 10% Off On Pre-Paid Orders</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto max-w-7xl flex h-14 md:h-16 items-center px-4 md:px-8">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 flex flex-col">
              <SheetHeader className="p-4 border-b shrink-0 bg-white">
                <SheetTitle className="text-left flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                    <Image src={BASE_LOGO} alt="Logo" width={40} height={40} />
                  </div>
                  <BrandName size="md" />
                </SheetTitle>
              </SheetHeader>

              {/* User Welcome (if logged in) */}
              {user && (
                <div className="p-4 bg-gray-50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                      {firstNameInitial ? (
                        <span className="text-lg font-semibold text-primary">
                          {firstNameInitial}
                        </span>
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {displayName ? `${greeting},` : greeting}
                      </p>
                      {displayName && (
                        <p className="font-semibold text-gray-900">
                          {displayName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              {/* <div className="p-4 border-b">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/deals"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <Zap className="w-5 h-5" />
                    <span className="text-sm font-medium">Deals</span>
                  </Link>
                  <Link
                    href="/products?sort=newest"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl text-emerald-600 hover:bg-emerald-100 transition-colors"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-medium">New</span>
                  </Link>
                </div>
              </div> */}

              {/* Collections List */}
              <div className="flex-1 overflow-y-auto py-4">
                <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Shop by Category
                </h3>
                <div className="space-y-1">
                  {collections.map((collection) => {
                    const IconComponent =
                      collectionIcons[collection.slug.toLowerCase()] || Gift;
                    return (
                      <Link
                        key={collection.slug}
                        href={`/products?collection=${collection.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <IconComponent className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                            {collection.name}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* User Section */}
              <div className="border-t p-4 space-y-2 shrink-0 bg-white">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : user ? (
                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent rounded-lg transition-colors"
                    >
                      <UserCircle className="h-5 w-5 text-gray-500" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent rounded-lg transition-colors"
                    >
                      <Package className="h-5 w-5 text-gray-500" />
                      <span>My Orders</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-red-50 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <LogOut className="h-5 w-5" />
                      )}
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <LogIn className="h-5 w-5" />
                      New User
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-11 h-11 md:w-14 md:h-14 rounded-lg flex items-center justify-center">
              <Image
                src={BASE_LOGO}
                alt="Logo"
                width={48}
                height={48}
                className="w-11 h-11 md:w-12 md:h-12"
              />
            </div>
            <span className="inline">
              <span className="md:hidden">
                <BrandName size="xs" />
              </span>
              <span className="hidden md:inline">
                <BrandName size="lg" />
              </span>
            </span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <div className="w-full max-w-md">
              <GlobalSearch />
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2 md:gap-2 ml-auto">
            {/* Mobile Search Icon */}
            <div className="md:hidden">
              <GlobalSearch />
            </div>

            {/* Wishlist (Mobile) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="relative md:hidden"
                >
                  <Link href="/wishlist">
                    <Heart className="h-5 w-5" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center">
                        {wishlistCount > 99 ? "99+" : wishlistCount}
                      </span>
                    )}
                    <span className="sr-only">Wishlist</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}</p>
              </TooltipContent>
            </Tooltip>

            {/* Wishlist (Desktop) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="relative hidden md:flex"
                >
                  <Link href="/wishlist">
                    <Heart className="h-5 w-5" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center">
                        {wishlistCount > 99 ? "99+" : wishlistCount}
                      </span>
                    )}
                    <span className="sr-only">Wishlist</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}</p>
              </TooltipContent>
            </Tooltip>

            <CartButton />

            {/* Desktop User Menu */}
            <div className="hidden md:block">
              {isLoading ? (
                <Button variant="ghost" size="icon" disabled>
                  <Loader2 className="h-5 w-5 animate-spin" />
                </Button>
              ) : user ? (
                <div className="relative group/usermenu">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-3 hover:bg-primary/5"
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                      {firstNameInitial ? (
                        <span className="text-sm font-semibold text-primary">
                          {firstNameInitial}
                        </span>
                      ) : (
                        <User className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-xs text-muted-foreground leading-none">
                        {greeting}
                      </p>
                      {displayNameShort && (
                        <p className="text-sm font-medium text-gray-900 leading-tight">
                          {displayNameShort}
                        </p>
                      )}
                    </div>
                  </Button>
                  {/* Invisible bridge to prevent gap */}
                  <div className="absolute right-0 top-full h-2 w-56 hidden group-hover/usermenu:block" />
                  <div className="absolute right-0 top-[calc(100%+0.5rem)] w-56 rounded-md border bg-popover p-1 shadow-md opacity-0 invisible translate-y-1 group-hover/usermenu:opacity-100 group-hover/usermenu:visible group-hover/usermenu:translate-y-0 transition-all duration-150 z-50">
                    <div className="px-3 py-3 border-b mb-1 bg-gray-50 -mx-1 -mt-1 rounded-t-md">
                      {displayName && (
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {displayName}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center cursor-pointer py-2 px-2 text-sm rounded-sm hover:bg-accent"
                    >
                      <UserCircle className="mr-3 h-4 w-4 text-gray-500" />
                      My Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center cursor-pointer py-2 px-2 text-sm rounded-sm hover:bg-accent"
                    >
                      <Package className="mr-3 h-4 w-4 text-gray-500" />
                      My Orders
                    </Link>
                    <Link
                      href="/wishlist"
                      className="flex items-center cursor-pointer py-2 px-2 text-sm rounded-sm hover:bg-accent"
                    >
                      <Heart className="mr-3 h-4 w-4 text-gray-500" />
                      Wishlist
                      {wishlistCount > 0 && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {wishlistCount}
                        </Badge>
                      )}
                    </Link>
                    <div className="bg-border -mx-1 my-1 h-px" />
                    <Link
                      href="/contact-us"
                      className="flex items-center cursor-pointer py-2 px-2 text-sm rounded-sm hover:bg-accent"
                    >
                      <Phone className="mr-3 h-4 w-4 text-gray-500" />
                      Contact Us
                    </Link>
                    {/* <Link
                      href="/help"
                      className="flex items-center cursor-pointer py-2 px-2 text-sm rounded-sm hover:bg-accent"
                    >
                      <HelpCircle className="mr-3 h-4 w-4 text-gray-500" />
                      Help Center
                    </Link> */}
                    <div className="bg-border -mx-1 my-1 h-px" />
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center w-full cursor-pointer py-2 px-2 text-sm rounded-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-3 h-4 w-4" />
                      )}
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Desktop Guest Menu */}
                  <div className="relative group/guestmenu">
                    <Button
                      variant="ghost"
                      className="hidden md:flex items-center gap-2 px-3 hover:bg-primary/5"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="hidden lg:block text-left">
                        <p className="text-xs text-muted-foreground leading-none">
                          Welcome
                        </p>
                        <p className="text-sm font-medium text-gray-900 leading-tight">
                          Create Account
                        </p>
                      </div>
                    </Button>
                    {/* Invisible bridge to prevent gap */}
                    <div className="absolute right-0 top-full h-2 w-56 hidden group-hover/guestmenu:block" />
                    <div className="absolute right-0 top-[calc(100%+0.5rem)] w-56 rounded-md border bg-popover p-1 shadow-md opacity-0 invisible translate-y-1 group-hover/guestmenu:opacity-100 group-hover/guestmenu:visible group-hover/guestmenu:translate-y-0 transition-all duration-150 z-50">
                      <div className="px-3 py-3 border-b mb-1 bg-gray-50 -mx-1 -mt-1 rounded-t-md">
                        <p className="text-sm font-semibold text-slate-900">
                          Welcome to Gadgets Kabila
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sign in to access your account
                        </p>
                      </div>
                      <Link
                        href="/auth/login"
                        className="flex items-center cursor-pointer py-2 px-2 text-sm rounded-sm hover:bg-accent"
                      >
                        <LogIn className="mr-3 h-4 w-4 text-gray-500" />
                        New User
                      </Link>
                      {/* <div className="bg-border -mx-1 my-1 h-px" /> */}
                      <Link
                        href="/contact-us"
                        className="flex items-center cursor-pointer py-2 px-2 text-sm rounded-sm hover:bg-accent"
                      >
                        <Phone className="mr-3 h-4 w-4 text-gray-500" />
                        Contact Us
                      </Link>
                      {/* <Link
                        href="/help"
                        className="flex items-center cursor-pointer py-2 px-2 text-sm rounded-sm hover:bg-accent"
                      >
                        <HelpCircle className="mr-3 h-4 w-4 text-gray-500" />
                        Help Center
                      </Link> */}
                    </div>
                  </div>

                  {/* Mobile Login Icon */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="md:hidden"
                      >
                        <Link href="/auth/login">
                          <LogIn className="h-5 w-5" />
                          <span className="sr-only">Sign In</span>
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Sign In</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>

            {/* Mobile User Avatar (when logged in) */}
            {!isLoading && user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/profile" className="md:hidden ml-2">
                    <Button variant="ghost" size="icon" className="relative">
                      <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/30 overflow-hidden">
                        {firstNameInitial ? (
                          <span className="text-xs font-semibold text-primary">
                            {firstNameInitial}
                          </span>
                        ) : (
                          <User className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <span className="sr-only">Profile</span>
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>My Profile</p>
                </TooltipContent>
              </Tooltip>
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
