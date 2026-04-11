"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Pencil, Power, Copy, Loader2, Users } from "lucide-react";
import Link from "next/link";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_purchase_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

interface CouponUsage {
  id: string;
  order_id: string;
  customer_name: string | null;
  customer_email: string | null;
  discount_amount: number;
  total_amount: number;
  created_at: string;
}

export default function CouponDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const couponId = params.couponId as string;

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [usageData, setUsageData] = useState<CouponUsage[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);

  useEffect(() => {
    const fetchCoupon = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", couponId)
        .single();

      if (data && !error) {
        setCoupon(data);
        // Fetch usage data after getting coupon
        fetchCouponUsage(data.code);
      }
      setLoading(false);
    };
    fetchCoupon();
  }, [couponId, supabase]);

  const fetchCouponUsage = async (couponCode: string) => {
    setLoadingUsage(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        customer_name,
        customer_email,
        discount_amount,
        total,
        created_at
      `,
      )
      .eq("coupon_code", couponCode)
      .order("created_at", { ascending: false });

    if (data && !error) {
      setUsageData(
        data.map((order) => ({
          id: order.id,
          order_id: order.id,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          discount_amount: order.discount_amount || 0,
          total_amount: order.total || 0,
          created_at: order.created_at,
        })),
      );
    }
    setLoadingUsage(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) {
      return { label: "Inactive", className: "bg-gray-100 text-gray-800" };
    }

    const now = new Date();
    const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

    if (validFrom && now < validFrom) {
      return { label: "Scheduled", className: "bg-blue-100 text-blue-800" };
    }
    if (validUntil && now > validUntil) {
      return { label: "Expired", className: "bg-red-100 text-red-800" };
    }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return { label: "Exhausted", className: "bg-orange-100 text-orange-800" };
    }
    return { label: "Active", className: "bg-green-100 text-green-800" };
  };

  const toggleCouponStatus = async () => {
    if (!coupon) return;
    setToggling(true);

    const { data, error } = await supabase
      .from("coupons")
      .update({ is_active: !coupon.is_active })
      .eq("id", coupon.id)
      .select();

    if (error) {
      console.error("Error toggling coupon status:", error);
      alert(`Failed to update coupon: ${error.message}`);
    } else {
      console.log("Coupon updated:", data);
      setCoupon((prev) =>
        prev ? { ...prev, is_active: !prev.is_active } : null,
      );
    }
    setToggling(false);
  };

  const copyCode = () => {
    if (coupon) {
      navigator.clipboard.writeText(coupon.code);
    }
  };

  if (loading) {
    return (
      <div className="mx-4 my-2">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="mx-4 my-2">
        <header className="p-2 flex items-center gap-4 mb-4">
          <Link href="/admin/dashboard/Coupons">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Coupon Not Found</h1>
        </header>
        <p className="text-gray-500">
          The coupon you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
    );
  }

  const status = getCouponStatus(coupon);

  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard/Coupons">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Coupon Details</h1>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={toggleCouponStatus}
            disabled={toggling}
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Power className="h-4 w-4 mr-2" />
            )}
            {coupon.is_active ? "Deactivate" : "Activate"}
          </Button>
          <Link href={`/admin/dashboard/Coupons/new?id=${coupon.id}`}>
            <Button>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Coupon
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Coupon code and discount details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Coupon Code</p>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-3 py-2 rounded font-mono text-lg">
                  {coupon.code}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyCode}
                  title="Copy code"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium">
                {coupon.description || "No description"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Discount Type</p>
                <p className="font-medium capitalize">{coupon.discount_type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Discount Value</p>
                <p className="font-medium text-lg">
                  {coupon.discount_type === "percentage"
                    ? `${coupon.discount_value}%`
                    : `₹${coupon.discount_value}`}
                </p>
              </div>
            </div>

            {coupon.discount_type === "percentage" &&
              coupon.max_discount_amount && (
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Maximum Discount</p>
                  <p className="font-medium">₹{coupon.max_discount_amount}</p>
                </div>
              )}

            <div className="space-y-1">
              <p className="text-sm text-gray-500">Minimum Purchase Amount</p>
              <p className="font-medium">
                {coupon.min_purchase_amount
                  ? `₹${coupon.min_purchase_amount}`
                  : "No minimum"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Usage & Validity */}
        <Card>
          <CardHeader>
            <CardTitle>Usage & Validity</CardTitle>
            <CardDescription>Usage limits and validity period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Used Count</p>
                <p className="font-medium text-lg">{coupon.used_count}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Usage Limit</p>
                <p className="font-medium text-lg">
                  {coupon.usage_limit ?? "Unlimited"}
                </p>
              </div>
            </div>

            {coupon.usage_limit && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Usage Progress</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{
                      width: `${Math.min((coupon.used_count / coupon.usage_limit) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {coupon.used_count} / {coupon.usage_limit} uses (
                  {Math.round((coupon.used_count / coupon.usage_limit) * 100)}%)
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Valid From</p>
                <p className="font-medium">
                  {coupon.valid_from
                    ? formatDate(coupon.valid_from)
                    : "Immediately"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Valid Until</p>
                <p className="font-medium">
                  {coupon.valid_until
                    ? formatDate(coupon.valid_until)
                    : "No expiry"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Active Status</p>
                <p className="font-medium">
                  {coupon.is_active ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-gray-500">Inactive</span>
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-medium">{formatDate(coupon.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupon Usage History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usage History
          </CardTitle>
          <CardDescription>
            Users who have used this coupon ({usageData.length} orders)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsage ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : usageData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No one has used this coupon yet.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Order Total</TableHead>
                    <TableHead className="font-semibold">Discount</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageData.map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell className="font-medium">
                        {usage.customer_name || "Guest"}
                      </TableCell>
                      <TableCell>{usage.customer_email || "-"}</TableCell>
                      <TableCell>₹{usage.total_amount}</TableCell>
                      <TableCell className="text-green-600">
                        -₹{usage.discount_amount}
                      </TableCell>
                      <TableCell>{formatDate(usage.created_at)}</TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/dashboard/Orders/${usage.order_id}`}
                        >
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
