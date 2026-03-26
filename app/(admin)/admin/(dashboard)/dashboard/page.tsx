"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Package,
  Users,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Plus,
  Eye,
  Settings,
  BarChart3,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface DashboardData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    newCustomers: number;
    totalProducts: number;
    pendingOrders: number;
    revenueGrowth: number;
    ordersGrowth: number;
  };
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    date: string;
    customer: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
  }>;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "processing":
    case "shipped":
      return <Package className="h-4 w-4 text-blue-500" />;
    case "delivered":
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "cancelled":
    case "refunded":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-red-100 text-red-800",
  };
  return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    const fetchData = async () => {
      try {
        const response = await fetch("/api/admin/analytics?period=30d");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-4 my-2 space-y-6">
      {/* Welcome Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, Admin!</h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/dashboard/Analytics">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </Link>
          <Link href="/admin/dashboard/Settings">
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data ? formatCurrency(data.summary.totalRevenue) : "₹0"}
            </div>
            {data && data.summary.revenueGrowth !== 0 && (
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp
                  className={`h-3 w-3 mr-1 ${data.summary.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}`}
                />
                <span
                  className={
                    data.summary.revenueGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {data.summary.revenueGrowth >= 0 ? "+" : ""}
                  {data.summary.revenueGrowth.toFixed(1)}%
                </span>
                <span className="ml-1">from last month</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.totalOrders || 0}
            </div>
            {data && data.summary.pendingOrders > 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                {data.summary.pendingOrders} pending
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.newCustomers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.totalProducts || 0}
            </div>
            {data &&
              data.lowStockProducts &&
              data.lowStockProducts.length > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  {data.lowStockProducts.length} low stock
                </p>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/dashboard/Products/new">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Plus className="h-5 w-5" />
                <span>Add Product</span>
              </Button>
            </Link>
            <Link href="/admin/dashboard/Orders">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Eye className="h-5 w-5" />
                <span>View Orders</span>
              </Button>
            </Link>
            <Link href="/admin/dashboard/Coupons/new">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Plus className="h-5 w-5" />
                <span>Create Coupon</span>
              </Button>
            </Link>
            <Link href="/admin/dashboard/Collections/new">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Plus className="h-5 w-5" />
                <span>Add Collection</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders & Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest customer orders</CardDescription>
            </div>
            <Link href="/admin/dashboard/Orders">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!data?.recentOrders || data.recentOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No orders yet
                </p>
              ) : (
                data.recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <p className="font-medium text-sm">
                          {order.customer || "Guest"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.date).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatCurrency(order.total)}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Stock Alerts
              </CardTitle>
              <CardDescription>Products running low</CardDescription>
            </div>
            <Link href="/admin/dashboard/Products">
              <Button variant="ghost" size="sm">
                Manage
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!data?.lowStockProducts || data.lowStockProducts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    All products have sufficient stock
                  </p>
                </div>
              ) : (
                data.lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <p className="font-medium text-sm truncate max-w-[200px]">
                      {product.name}
                    </p>
                    <Badge
                      variant="secondary"
                      className={
                        product.stock === 0
                          ? "bg-red-100 text-red-800"
                          : product.stock <= 5
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {product.stock === 0
                        ? "Out of stock"
                        : `${product.stock} left`}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/dashboard/Customers">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Customers</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage customer accounts
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/dashboard/Reviews">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Reviews</h3>
                  <p className="text-sm text-muted-foreground">
                    Moderate product reviews
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/dashboard/ContentManagement">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <Settings className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Content</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage site content
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 ml-auto text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
