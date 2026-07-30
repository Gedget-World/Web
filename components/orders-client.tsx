"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
  Package,
  ChevronRight,
  ChevronLeft,
  Search,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  RotateCcw,
  ArrowUpDown,
  Calendar,
  IndianRupee,
  Filter,
  PackageX,
  AlertTriangle,
  PackageCheck,
  Navigation,
} from "lucide-react";

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  estimated_delivery?: string;
  order_items: {
    id: string;
    quantity: number;
    product_id: string;
    products: {
      id: string;
      name: string;
      price: number;
      image_url: string;
      stock?: number;
    } | null;
  }[];
  has_pending_review?: boolean;
};

interface OrdersClientProps {
  orders: Order[];
  deliveredThisMonth: number;
  pendingReviewCount: number;
  currencySymbol: string;
  currentPage: number;
  totalPages: number;
}

const STATUS_FILTERS = [
  { value: "all", label: "All Orders", icon: Package },
  { value: "pending", label: "Pending", icon: Clock },
  { value: "payment_failed", label: "Payment Failed", icon: AlertTriangle },
  { value: "processing", label: "Processing", icon: RefreshCw },
  { value: "packed", label: "Packed", icon: PackageCheck },
  { value: "shipped", label: "Shipped", icon: Truck },
  { value: "out_for_delivery", label: "Out for Delivery", icon: Navigation },
  { value: "delivered", label: "Delivered", icon: CheckCircle2 },
  { value: "returns", label: "Returns", icon: RotateCcw },
  { value: "refunded", label: "Refunded", icon: IndianRupee },
  { value: "cancelled", label: "Cancelled", icon: XCircle },
];

// Statuses grouped under the single "Returns" filter pill/badge.
const RETURN_STATUSES = [
  "return_requested",
  "return_approved",
  "return_rejected",
  "return_in_transit",
  "returned",
  "rto",
  "rto_received",
];

const formatStatusLabel = (status: string) =>
  status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "highest", label: "Highest Value" },
  { value: "lowest", label: "Lowest Value" },
];

const DATE_FILTERS = [
  { value: "all", label: "All Time" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "90days", label: "Last 3 Months" },
  { value: "year", label: "This Year" },
];

export function OrdersClient({
  orders,
  deliveredThisMonth,
  pendingReviewCount,
  currencySymbol,
  currentPage,
  totalPages,
}: OrdersClientProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (statusFilter === "returns") {
      result = result.filter((order) => RETURN_STATUSES.includes(order.status));
    } else if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.order_items.some((item) =>
            item.products?.name?.toLowerCase().includes(query),
          ),
      );
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      switch (dateFilter) {
        case "7days":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "30days":
          filterDate.setDate(now.getDate() - 30);
          break;
        case "90days":
          filterDate.setDate(now.getDate() - 90);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear(), 0, 1);
          break;
      }
      result = result.filter(
        (order) => new Date(order.created_at) >= filterDate,
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "highest":
          return b.total - a.total;
        case "lowest":
          return a.total - b.total;
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    return result;
  }, [orders, statusFilter, sortBy, dateFilter, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "payment_failed":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "packed":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "out_for_delivery":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "return_requested":
      case "return_approved":
      case "return_in_transit":
        return "bg-pink-100 text-pink-800 border-pink-200";
      case "return_rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "returned":
        return "bg-slate-200 text-slate-800 border-slate-300";
      case "rto":
      case "rto_received":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "refunded":
        return "bg-teal-100 text-teal-800 border-teal-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case "pending":
        return "border-l-yellow-500";
      case "payment_failed":
        return "border-l-orange-500";
      case "processing":
        return "border-l-blue-500";
      case "packed":
        return "border-l-indigo-500";
      case "shipped":
        return "border-l-purple-500";
      case "out_for_delivery":
        return "border-l-cyan-500";
      case "delivered":
        return "border-l-green-500";
      case "cancelled":
        return "border-l-red-500";
      case "return_requested":
      case "return_approved":
      case "return_in_transit":
        return "border-l-pink-500";
      case "return_rejected":
        return "border-l-red-500";
      case "returned":
        return "border-l-slate-400";
      case "rto":
      case "rto_received":
        return "border-l-rose-500";
      case "refunded":
        return "border-l-teal-500";
      default:
        return "border-l-slate-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "payment_failed":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case "packed":
        return <PackageCheck className="h-4 w-4 text-indigo-600" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-purple-600" />;
      case "out_for_delivery":
        return <Navigation className="h-4 w-4 text-cyan-600" />;
      case "delivered":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "return_requested":
      case "return_approved":
      case "return_in_transit":
        return <RotateCcw className="h-4 w-4 text-pink-600" />;
      case "return_rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "returned":
        return <PackageX className="h-4 w-4 text-slate-600" />;
      case "rto":
      case "rto_received":
        return <RotateCcw className="h-4 w-4 text-rose-600" />;
      case "refunded":
        return <IndianRupee className="h-4 w-4 text-teal-600" />;
      default:
        return <Package className="h-4 w-4 text-slate-600" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <div className="container max-w-4xl mx-auto py-6 md:py-12 px-4 md:px-8">
        {/* Gradient Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 p-4 md:p-5 mb-4 text-white">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">My Orders</h1>
                <p className="text-white/80 text-sm">
                  Track and manage your purchases
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* Filters Section */}
        <div className="space-y-4 mb-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by order ID or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const isActive = statusFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Sort and Date Filter Row */}
          <div className="flex flex-wrap gap-2">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              {/* Animated Empty State */}
              <div className="relative mb-6">
                <div className="h-24 w-24 rounded-full bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center animate-pulse">
                  <Package className="h-12 w-12 text-slate-400" />
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center animate-bounce">
                  <Search className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {searchQuery || statusFilter !== "all"
                  ? "No orders found"
                  : "No orders yet"}
              </h3>
              <p className="text-slate-500 text-sm mb-6 text-center max-w-sm">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters or search query"
                  : "Start shopping to see your orders here"}
              </p>
              {searchQuery || statusFilter !== "all" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/products">Browse Products</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden bg-white">
            {filteredOrders.map((order) => {
              const itemCount = order.order_items.reduce(
                (sum, item) => sum + item.quantity,
                0,
              );

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className={`flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-l-4 ${getStatusBorderColor(order.status)}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getStatusIcon(order.status)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(order.status)}`}
                        >
                          {formatStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatDate(order.created_at)} · {itemCount} item
                        {itemCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    {currencySymbol}
                    {Number(order.total).toLocaleString("en-IN")}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              asChild={currentPage > 1}
            >
              {currentPage > 1 ? (
                <Link href={`/orders?page=${currentPage - 1}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Link>
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </>
              )}
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    className="w-9"
                    asChild={pageNum !== currentPage}
                  >
                    {pageNum !== currentPage ? (
                      <Link href={`/orders?page=${pageNum}`}>{pageNum}</Link>
                    ) : (
                      <span>{pageNum}</span>
                    )}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              asChild={currentPage < totalPages}
            >
              {currentPage < totalPages ? (
                <Link href={`/orders?page=${currentPage + 1}`}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Pull to Refresh Indicator (Visual Only) */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none">
          <div className="bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
            <span className="text-sm text-slate-600">Refreshing...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
