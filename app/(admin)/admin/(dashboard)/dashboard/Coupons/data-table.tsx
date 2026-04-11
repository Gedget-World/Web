"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Copy,
  Eye,
  Power,
} from "lucide-react";
import Link from "next/link";

type TabFilter = "all" | "active" | "inactive" | "expired" | "scheduled";

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

export function DataTable() {
  const supabase = createClient();
  const [data, setData] = useState<Coupon[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const limit = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const now = new Date().toISOString();

      let query = supabase
        .from("coupons")
        .select("*", { count: "exact" })
        .ilike("code", `%${search}%`)
        .order("created_at", { ascending: false });

      // Apply tab filter
      switch (activeTab) {
        case "active":
          query = query
            .eq("is_active", true)
            .or(`valid_from.lte.${now},valid_from.is.null`)
            .or(`valid_until.gte.${now},valid_until.is.null`);
          break;
        case "inactive":
          query = query.eq("is_active", false);
          break;
        case "expired":
          query = query.not("valid_until", "is", null).lt("valid_until", now);
          break;
        case "scheduled":
          query = query.not("valid_from", "is", null).gt("valid_from", now);
          break;
      }

      query = query.range(page * limit, page * limit + limit - 1);

      const { data, error, count } = await query;
      if (!error && data) {
        setData(data);
        setTotalCount(count || 0);
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase, search, page, activeTab]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !coupon.is_active })
      .eq("id", coupon.id);

    if (!error) {
      setData((prev) =>
        prev.map((c) =>
          c.id === coupon.id ? { ...c, is_active: !c.is_active } : c,
        ),
      );
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}%`;
    }
    return `₹${coupon.discount_value}`;
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

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as TabFilter);
          setPage(0);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by coupon code..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-sm"
        />
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Code</TableHead>
              <TableHead className="font-semibold">Discount</TableHead>
              <TableHead className="font-semibold">Min. Purchase</TableHead>
              <TableHead className="font-semibold">Usage</TableHead>
              <TableHead className="font-semibold">Valid From</TableHead>
              <TableHead className="font-semibold">Valid Until</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-gray-500"
                >
                  No coupons found
                </TableCell>
              </TableRow>
            ) : (
              data.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(coupon.code)}
                          title="Copy code"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">
                          {coupon.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatDiscount(coupon)}
                      </span>
                      {coupon.discount_type === "percentage" &&
                        coupon.max_discount_amount && (
                          <span className="text-xs text-gray-500 block">
                            Max: ₹{coupon.max_discount_amount}
                          </span>
                        )}
                    </TableCell>
                    <TableCell>
                      {coupon.min_purchase_amount
                        ? `₹${coupon.min_purchase_amount}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {coupon.usage_limit
                        ? `${coupon.used_count ?? 0} / ${coupon.usage_limit}`
                        : `${coupon.used_count ?? 0} / ∞`}
                    </TableCell>
                    <TableCell>{formatDate(coupon.valid_from)}</TableCell>
                    <TableCell>{formatDate(coupon.valid_until)}</TableCell>
                    <TableCell>
                      <Badge className={status.className}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <Link href={`/admin/dashboard/Coupons/${coupon.id}`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          <Link
                            href={`/admin/dashboard/Coupons/new?id=${coupon.id}`}
                          >
                            <DropdownMenuItem className="cursor-pointer">
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => toggleCouponStatus(coupon)}
                          >
                            <Power className="h-4 w-4 mr-2" />
                            {coupon.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {data.length} of {totalCount} coupons
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page + 1} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
