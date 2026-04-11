"use client";

import { useState, useMemo } from "react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  Star,
  AlertTriangle,
  RotateCcw,
  ArrowUpDown,
  Calendar,
  TrendingUp,
  IndianRupee,
  PackageCheck,
  Eye,
  Filter,
  PackageX,
  Timer,
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
  totalOrders: number;
  totalSpent: number;
  inTransitCount: number;
  deliveredThisMonth: number;
  pendingReviewCount: number;
  currencySymbol: string;
  currentPage: number;
  totalPages: number;
}

const STATUS_FILTERS = [
  { value: "all", label: "All Orders", icon: Package },
  { value: "pending", label: "Pending", icon: Clock },
  { value: "processing", label: "Processing", icon: RefreshCw },
  { value: "shipped", label: "Shipped", icon: Truck },
  { value: "delivered", label: "Delivered", icon: CheckCircle2 },
  { value: "cancelled", label: "Cancelled", icon: XCircle },
];

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
  totalOrders,
  totalSpent,
  inTransitCount,
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
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const { addItem } = useCart();
  const { toast } = useToast();

  const handleReorder = (order: Order) => {
    setReorderingId(order.id);
    let addedCount = 0;
    let failedCount = 0;

    for (const item of order.order_items) {
      if (item.products) {
        for (let i = 0; i < item.quantity; i++) {
          const success = addItem({
            id: item.products.id,
            name: item.products.name,
            price: item.products.price,
            image_url: item.products.image_url,
            stock: item.products.stock,
          });
          if (success) {
            addedCount++;
          } else {
            failedCount++;
          }
        }
      }
    }

    setReorderingId(null);

    if (addedCount > 0) {
      toast({
        title: "Items added to cart",
        description: `${addedCount} item${addedCount > 1 ? "s" : ""} added to your cart${failedCount > 0 ? `. ${failedCount} item${failedCount > 1 ? "s" : ""} couldn't be added (out of stock).` : "."}`,
      });
    } else {
      toast({
        title: "Unable to reorder",
        description: "All items are currently out of stock.",
        variant: "destructive",
      });
    }
  };

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (statusFilter !== "all") {
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

  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusBorderColor = (status: string) => {
    switch (status) {
      case "pending":
        return "border-l-yellow-500";
      case "processing":
        return "border-l-blue-500";
      case "shipped":
        return "border-l-purple-500";
      case "delivered":
        return "border-l-green-500";
      case "cancelled":
        return "border-l-red-500";
      default:
        return "border-l-slate-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-purple-600" />;
      case "delivered":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-slate-600" />;
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case "pending":
        return 25;
      case "processing":
        return 50;
      case "shipped":
        return 75;
      case "delivered":
        return 100;
      case "cancelled":
        return 0;
      default:
        return 0;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getEstimatedDelivery = (order: Order) => {
    if (order.status === "delivered" || order.status === "cancelled")
      return null;
    if (order.estimated_delivery) return new Date(order.estimated_delivery);
    // Mock: 5-7 days from order date
    const orderDate = new Date(order.created_at);
    orderDate.setDate(orderDate.getDate() + 5);
    return orderDate;
  };

  const isReturnWindowClosing = (order: Order) => {
    if (order.status !== "delivered") return false;
    const deliveredDate = new Date(order.created_at); // Assuming delivered same day for mock
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysSinceDelivery >= 25 && daysSinceDelivery <= 30;
  };

  // Mini sparkline data (mock)
  const sparklineData = [30, 45, 35, 50, 40, 60, 55];

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <div className="container max-w-4xl mx-auto py-6 md:py-12 px-4 md:px-8">
        {/* Gradient Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 md:p-8 mb-8 text-white">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
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

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-xs text-white/70">Total Orders</p>
                <p className="text-xl font-bold">{totalOrders}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-xs text-white/70">Total Spent</p>
                <p className="text-xl font-bold">
                  {currencySymbol}
                  {totalSpent.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-xs text-white/70">Avg Order Value</p>
                <p className="text-xl font-bold">
                  {currencySymbol}
                  {Math.round(avgOrderValue).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-xs text-white/70">In Transit</p>
                <p className="text-xl font-bold">{inTransitCount}</p>
              </div>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {totalOrders}
                </p>
                <p className="text-xs text-slate-500">Total Orders</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {inTransitCount}
                </p>
                <p className="text-xs text-slate-500">In Transit</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <PackageCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {deliveredThisMonth}
                </p>
                <p className="text-xs text-slate-500">Delivered</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {pendingReviewCount}
                  </p>
                  <p className="text-xs text-slate-500">To Review</p>
                </div>
                {pendingReviewCount > 0 && (
                  <Badge className="bg-amber-500 text-white text-[10px] h-5">
                    New
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Spending Mini Chart */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-slate-600" />
                <span className="font-medium text-slate-900">
                  Monthly Spending
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Mini Sparkline */}
                <div className="flex items-end gap-0.5 h-8">
                  {sparklineData.map((value, i) => (
                    <div
                      key={i}
                      className="w-2 bg-linear-to-t from-indigo-500 to-purple-500 rounded-t"
                      style={{ height: `${value}%` }}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-green-600">
                  +12%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

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
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const itemCount = order.order_items.reduce(
                (sum, item) => sum + item.quantity,
                0,
              );
              const firstProduct = order.order_items[0]?.products;
              const estimatedDelivery = getEstimatedDelivery(order);
              const returnWindowClosing = isReturnWindowClosing(order);
              const progressValue = getProgressValue(order.status);

              return (
                <Card
                  key={order.id}
                  className={`hover:shadow-lg transition-all hover:-translate-y-0.5 border-l-4 ${getStatusBorderColor(order.status)} overflow-hidden group`}
                >
                  <CardContent className="p-0">
                    {/* Return Window Alert */}
                    {returnWindowClosing && (
                      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="text-xs text-amber-800 font-medium">
                          Return window closing soon! Only a few days left.
                        </span>
                      </div>
                    )}

                    {/* Review Pending Badge */}
                    {order.has_pending_review && (
                      <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-indigo-600" />
                          <span className="text-xs text-indigo-800 font-medium">
                            Review this order and earn rewards!
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-indigo-600"
                          asChild
                        >
                          <Link href={`/orders/${order.id}`}>Write Review</Link>
                        </Button>
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex flex-col gap-4">
                        {/* Order Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(order.status)}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-900">
                                  #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getStatusColor(order.status)}`}
                                >
                                  {order.status.charAt(0).toUpperCase() +
                                    order.status.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500">
                                {formatDate(order.created_at)} · {itemCount}{" "}
                                item
                                {itemCount !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 text-lg">
                              {currencySymbol}
                              {Number(order.total).toLocaleString("en-IN")}
                            </span>
                            {estimatedDelivery && (
                              <div className="flex items-center gap-1 mt-1 justify-end">
                                <Timer className="h-3 w-3 text-slate-400" />
                                <span className="text-xs text-slate-500">
                                  Est.{" "}
                                  {estimatedDelivery.toLocaleDateString(
                                    "en-IN",
                                    {
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Progress Tracker */}
                        {order.status !== "cancelled" && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-500">
                              <span
                                className={
                                  progressValue >= 25
                                    ? "text-indigo-600 font-medium"
                                    : ""
                                }
                              >
                                Ordered
                              </span>
                              <span
                                className={
                                  progressValue >= 50
                                    ? "text-indigo-600 font-medium"
                                    : ""
                                }
                              >
                                Processing
                              </span>
                              <span
                                className={
                                  progressValue >= 75
                                    ? "text-indigo-600 font-medium"
                                    : ""
                                }
                              >
                                Shipped
                              </span>
                              <span
                                className={
                                  progressValue >= 100
                                    ? "text-green-600 font-medium"
                                    : ""
                                }
                              >
                                Delivered
                              </span>
                            </div>
                            <Progress
                              value={progressValue}
                              className="h-2 bg-slate-100 *:bg-linear-to-r *:from-indigo-500 *:to-purple-500"
                            />
                          </div>
                        )}

                        {/* Product Preview */}
                        <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                          <div className="flex -space-x-2">
                            {order.order_items.slice(0, 3).map((item) => (
                              <div
                                key={item.id}
                                className="relative h-12 w-12 rounded-lg overflow-hidden bg-white border-2 border-white shadow-sm"
                              >
                                <img
                                  src={
                                    item.products?.image_url ||
                                    "/placeholder.svg"
                                  }
                                  alt={item.products?.name || "Product"}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ))}
                            {order.order_items.length > 3 && (
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-200 border-2 border-white text-xs font-medium text-slate-600">
                                +{order.order_items.length - 3}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {firstProduct?.name || "Product"}
                            </p>
                            {order.order_items.length > 1 && (
                              <p className="text-xs text-slate-500">
                                +{order.order_items.length - 1} more item
                                {order.order_items.length > 2 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                          >
                            <Link href={`/orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Link>
                          </Button>

                          {order.status === "shipped" && (
                            <Button
                              size="sm"
                              className="flex-1 bg-purple-600 hover:bg-purple-700"
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              Track Order
                            </Button>
                          )}

                          {order.status === "delivered" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleReorder(order)}
                              disabled={reorderingId === order.id}
                            >
                              <RefreshCw
                                className={`h-4 w-4 mr-1 ${reorderingId === order.id ? "animate-spin" : ""}`}
                              />
                              {reorderingId === order.id
                                ? "Adding..."
                                : "Reorder"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
