"use client";

import { useState, useEffect } from "react";
import { State, City } from "country-state-city";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Calendar,
  Phone,
  CheckCircle2,
  AlertCircle,
  Package,
  Heart,
  Star,
  Truck,
  Clock,
  Check,
  Crown,
  Award,
  Gift,
  Copy,
  Share2,
  MapPin,
  Shield,
  RotateCcw,
  Headphones,
  MessageCircle,
  HelpCircle,
  ChevronRight,
  Zap,
  Edit3,
  Trash2,
  Plus,
  Eye,
  RefreshCw,
  Bell,
  Settings,
  ExternalLink,
  PackageCheck,
  PackageX,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CustomerProfileForm } from "@/components/customer-profile-form";
import { useToast } from "@/hooks/use-toast";
import { useCustomer } from "@/hooks/use-customer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Customer = {
  id?: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  preferences: Record<string, any>;
  marketing_consent: boolean;
  phone_verified: boolean;
  created_at?: string;
  updated_at?: string;
};

type Order = {
  id: string;
  created_at: string;
  total: number;
  status: string;
  order_items?: {
    product:
      | {
          name: string;
          image_url: string;
        }
      | {
          name: string;
          image_url: string;
        }[];
    quantity: number;
    price: number;
  }[];
};

type Address = {
  id: string;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  type: string;
};

type WishlistItem = {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    slug: string;
  };
};

interface ProfileClientProps {
  user: {
    id: string;
    email: string;
    created_at: string;
    email_confirmed_at?: string;
    avatar_url?: string;
  };
  customer: Customer | null;
  orders: Order[];
  orderCount: number;
  address: Address | null;
  wishlistItems: WishlistItem[];
  reviewCount: number;
  pendingReviewCount: number;
}

export function ProfileClient({
  user,
  customer,
  orders,
  orderCount,
  address: initialAddress,
  wishlistItems,
  reviewCount,
  pendingReviewCount,
}: ProfileClientProps) {
  const { toast } = useToast();
  const { saveAddress, address: cachedAddress } = useCustomer(user.id);

  const [newsletterEnabled, setNewsletterEnabled] = useState(
    customer?.marketing_consent || false,
  );
  const [copied, setCopied] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const INDIA_CODE = "IN";

  // Use cached address if available, otherwise use initial
  const currentAddress = cachedAddress || initialAddress;

  const [addressForm, setAddressForm] = useState({
    full_name: currentAddress?.full_name || "",
    address_line1: currentAddress?.address_line1 || "",
    address_line2: currentAddress?.address_line2 || "",
    city: currentAddress?.city || "",
    state: currentAddress?.state || "",
    postal_code: currentAddress?.postal_code || "",
    country: currentAddress?.country || "India",
  });

  // Sync form when address changes
  useEffect(() => {
    if (currentAddress) {
      setAddressForm({
        full_name: currentAddress.full_name || "",
        address_line1: currentAddress.address_line1 || "",
        address_line2: currentAddress.address_line2 || "",
        city: currentAddress.city || "",
        state: currentAddress.state || "",
        postal_code: currentAddress.postal_code || "",
        country: "India",
      });
    }
  }, [currentAddress]);

  // Load Indian states on mount
  useEffect(() => {
    const indiaStates = State.getStatesOfCountry(INDIA_CODE);
    setStates(indiaStates || []);
  }, []);

  // Load cities when state changes
  useEffect(() => {
    if (addressForm.state) {
      const selectedState = states.find((s) => s.name === addressForm.state);
      if (selectedState) {
        const stateCities = City.getCitiesOfState(
          INDIA_CODE,
          selectedState.isoCode,
        );
        setCities(stateCities || []);
      }
    }
  }, [addressForm.state, states]);

  const handleSaveAddress = async () => {
    if (
      !addressForm.full_name ||
      !addressForm.address_line1 ||
      !addressForm.city ||
      !addressForm.state ||
      !addressForm.postal_code
    ) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingAddress(true);
    const result = await saveAddress(addressForm);
    setIsSavingAddress(false);

    if (result) {
      toast({
        title: "Address Saved",
        description: "Your address has been updated successfully.",
      });
      setIsEditingAddress(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Calculate profile completion
  const calculateProfileCompletion = () => {
    let completed = 0;
    const total = 6;

    if (customer?.first_name) completed++;
    if (customer?.last_name) completed++;
    if (customer?.phone) completed++;
    if (customer?.date_of_birth) completed++;
    if (currentAddress) completed++;
    if (user.email_confirmed_at) completed++;

    return Math.round((completed / total) * 100);
  };

  // Member tier based on orders
  const getMemberTier = () => {
    if (orderCount >= 20)
      return {
        name: "Gold",
        color: "bg-gradient-to-r from-yellow-400 to-amber-500",
        icon: Crown,
      };
    if (orderCount >= 10)
      return {
        name: "Silver",
        color: "bg-gradient-to-r from-slate-300 to-slate-400",
        icon: Award,
      };
    return {
      name: "Bronze",
      color: "bg-gradient-to-r from-orange-400 to-orange-600",
      icon: Award,
    };
  };

  // Order status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <PackageCheck className="h-4 w-4 text-green-600" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-blue-600" />;
      case "cancelled":
        return <PackageX className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-amber-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200";
      case "shipped":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  // Referral code
  const referralCode = `GK${user.id.slice(0, 6).toUpperCase()}`;

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const profileCompletion = calculateProfileCompletion();
  const memberTier = getMemberTier();
  const TierIcon = memberTier.icon;

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <div className="container mx-auto max-w-7xl py-6 md:py-12 px-4 md:px-8">
        {/* Welcome Banner with Gradient Header */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 mb-8 text-white">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl md:text-3xl font-bold border-2 border-white/30 overflow-hidden">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt="Profile"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    customer?.first_name?.[0]?.toUpperCase() ||
                    user.email[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm text-white/80">{getGreeting()}</p>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    {customer?.first_name
                      ? `${customer.first_name} ${customer.last_name || ""}`
                      : "Welcome!"}
                  </h1>
                  <p className="text-sm text-white/80">{user.email}</p>
                </div>
              </div>

              {/* Member Tier Badge */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${memberTier.color} text-white shadow-lg w-fit`}
              >
                <TierIcon className="h-5 w-5" />
                <span className="font-semibold">{memberTier.name} Member</span>
              </div>
            </div>

            {/* Profile Completion Progress */}
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Profile Completion</span>
                <span className="text-sm font-bold">{profileCompletion}%</span>
              </div>
              <Progress value={profileCompletion} className="h-2 bg-white" />
              {profileCompletion < 100 && (
                <p className="text-xs text-white/70 mt-2">
                  Complete your profile to unlock exclusive benefits!
                </p>
              )}
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* Verified Badges Row */}
        <div className="flex flex-wrap gap-3 mb-6">
          {user.email_confirmed_at ? (
            <Badge className="flex items-center gap-1.5 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Email Verified
            </Badge>
          ) : (
            <Badge className="flex items-center gap-1.5 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
              <AlertCircle className="h-3.5 w-3.5" />
              Email Not Verified
            </Badge>
          )}
          {customer?.phone_verified ? (
            <Badge className="flex items-center gap-1.5 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
              <Phone className="h-3.5 w-3.5" />
              Phone Verified
            </Badge>
          ) : customer?.phone ? (
            <Badge className="flex items-center gap-1.5 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
              <Phone className="h-3.5 w-3.5" />
              Verify Phone
            </Badge>
          ) : null}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Profile Form */}
            <CustomerProfileForm
              user={{ id: user.id, email: user.email }}
              initialCustomer={customer}
            />

            {/* Recent Orders Preview */}
            <Card className="hover:shadow-md transition-all border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-slate-600" />
                      Recent Orders
                    </CardTitle>
                    <CardDescription>Your latest purchases</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/orders">
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(order.status)}
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              Order #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(order.created_at).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </Badge>
                          <span className="text-sm font-semibold">
                            ₹{order.total.toLocaleString("en-IN")}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            asChild
                          >
                            <Link href={`/orders/${order.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 mb-2">No orders yet</p>
                    <p className="text-sm text-slate-500 mb-4">
                      Start shopping to see your orders here
                    </p>
                    <Button asChild>
                      <Link href="/products">Browse Products</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saved Address */}
            <Card className="hover:shadow-md transition-all border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-slate-600" />
                      Delivery Address
                    </CardTitle>
                    <CardDescription>
                      Your default shipping address
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingAddress(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />{" "}
                    {currentAddress ? "Edit" : "Add"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {currentAddress ? (
                  <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-900">
                            {currentAddress.full_name}
                          </p>
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-blue-100 text-blue-700"
                          >
                            Default
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600">
                          {currentAddress.address_line1}
                          {currentAddress.address_line2 &&
                            `, ${currentAddress.address_line2}`}
                        </p>
                        <p className="text-sm text-slate-600">
                          {currentAddress.city}, {currentAddress.state} -{" "}
                          {currentAddress.postal_code}
                        </p>
                        <p className="text-sm text-slate-600">
                          {currentAddress.country}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm mb-3">
                      No address saved yet
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingAddress(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Address
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address Edit Dialog */}
            <Dialog open={isEditingAddress} onOpenChange={setIsEditingAddress}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {currentAddress ? "Edit Address" : "Add Address"}
                  </DialogTitle>
                  <DialogDescription>
                    {currentAddress
                      ? "Update your delivery address"
                      : "Add a new delivery address"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={addressForm.full_name}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          full_name: e.target.value,
                        })
                      }
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_line1">Address Line 1 *</Label>
                    <Textarea
                      id="address_line1"
                      value={addressForm.address_line1}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          address_line1: e.target.value,
                        })
                      }
                      placeholder="House/Flat No., Building, Street"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={addressForm.address_line2}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          address_line2: e.target.value,
                        })
                      }
                      placeholder="Landmark (optional)"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Select
                        value={addressForm.city}
                        onValueChange={(value) =>
                          setAddressForm({
                            ...addressForm,
                            city: value,
                          })
                        }
                        disabled={!addressForm.state}
                      >
                        <SelectTrigger id="city" className="w-full">
                          <SelectValue
                            placeholder={
                              addressForm.state
                                ? "Select city"
                                : "Select state first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.name} value={city.name}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">PIN Code *</Label>
                      <Input
                        id="postal_code"
                        value={addressForm.postal_code}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            postal_code: e.target.value,
                          })
                        }
                        placeholder="400001"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Select
                        value={addressForm.state}
                        onValueChange={(value) =>
                          setAddressForm({
                            ...addressForm,
                            state: value,
                          })
                        }
                      >
                        <SelectTrigger id="state" className="w-full">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state.isoCode} value={state.name}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input id="country" value="India" disabled />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingAddress(false)}
                    disabled={isSavingAddress}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveAddress}
                    disabled={isSavingAddress}
                  >
                    {isSavingAddress ? "Saving..." : "Save Address"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Wishlist Preview */}
            <Card className="hover:shadow-md transition-all border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-pink-500" />
                      Wishlist
                    </CardTitle>
                    <CardDescription>
                      {wishlistItems.length} items in your wishlist
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/wishlist">
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {wishlistItems.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {wishlistItems.slice(0, 4).map((item) => (
                      <Link
                        key={item.id}
                        href={`/products/${item.product.slug}`}
                        className="group"
                      >
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2">
                          <Image
                            src={item.product.image_url || "/placeholder.svg"}
                            alt={item.product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-slate-600">
                          ₹{item.product.price.toLocaleString("en-IN")}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Heart className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">
                      Your wishlist is empty
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      asChild
                    >
                      <Link href="/products">Explore Products</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Account Information */}
            <Card className="hover:shadow-md transition-all border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-slate-600" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                    <Mail className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">
                      Email
                    </p>
                    <p className="text-sm text-slate-900 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                    <Calendar className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">
                      Member Since
                    </p>
                    <p className="text-sm text-slate-900">
                      {new Date(user.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Invitation */}
            {pendingReviewCount > 0 && (
              <Card className="hover:shadow-md transition-all border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Star className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">
                        {pendingReviewCount} products to review
                      </p>
                      <p className="text-xs text-amber-700">
                        Share your experience!
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                    asChild
                  >
                    <Link href="/orders">Write Reviews</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Referral Banner */}
            {/* <Card className="hover:shadow-md transition-all border-slate-200 overflow-hidden">
              <div className="bg-linear-to-r from-indigo-500 to-purple-600 p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5" />
                  <span className="font-semibold">Refer & Earn</span>
                </div>
                <p className="text-sm text-white/90">
                  Invite friends and get ₹100 per referral!
                </p>
              </div>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-2">
                  Your referral code
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-lg px-3 py-2 font-mono text-sm font-semibold">
                    {referralCode}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyReferralCode}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card> */}

            {/* Account Benefits */}
            <Card className="hover:shadow-md transition-all border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-slate-600" />
                  Your Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <RotateCcw className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-slate-700">Free Returns (30 days)</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-slate-700">Free Shipping</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-slate-700">Priority Support</span>
                </div>
              </CardContent>
            </Card>

            {/* Newsletter Preferences */}
            <Card className="hover:shadow-md transition-all border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="h-5 w-5 text-slate-600" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="newsletter" className="text-sm font-medium">
                      Newsletter
                    </Label>
                    <p className="text-xs text-slate-500">
                      Get deals & updates
                    </p>
                  </div>
                  <Switch
                    id="newsletter"
                    checked={newsletterEnabled}
                    onCheckedChange={setNewsletterEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card className="hover:shadow-md transition-all border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Headphones className="h-5 w-5 text-slate-600" />
                  Help & Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-9"
                  asChild
                >
                  <Link href="/contact-us">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Us
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-9"
                  asChild
                >
                  <Link href="/help">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Help
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-9"
                  asChild
                >
                  <Link href="/policies/shipping-and-delivery-policy">
                    <Truck className="h-4 w-4 mr-2" />
                    Shipping Policy
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
