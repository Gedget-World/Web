"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  IndianRupee,
  Users,
  Package,
  Loader2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    newCustomers: number;
    conversionRate: number;
    totalDiscount: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    totalProducts: number;
    revenueGrowth: number;
    ordersGrowth: number;
  };
  dailyData: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  revenueByStatus: Array<{
    status: string;
    revenue: number;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
    price: number;
  }>;
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    date: string;
    customer: string;
  }>;
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
}

const COLORS = ["#fbbf24", "#3b82f6", "#8b5cf6", "#22c55e", "#ef4444"];

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
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

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  prefix = "",
}: {
  title: string;
  value: string | number;
  icon: any;
  change?: number;
  changeLabel?: string;
  prefix?: string;
}) {
  const isPositive = change && change >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}
          {typeof value === "number" ? value.toLocaleString("en-IN") : value}
        </div>
        {change !== undefined && (
          <div className="flex items-center text-xs mt-1">
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-muted-foreground ml-1">
              {changeLabel || "vs last period"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch analytics");
      }

      setData(result);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mx-4 my-2 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground">
            Monitor your store performance and customer behavior
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.summary.totalRevenue)}
          icon={IndianRupee}
          change={data.summary.revenueGrowth}
        />
        <StatCard
          title="Total Orders"
          value={data.summary.totalOrders}
          icon={ShoppingCart}
          change={data.summary.ordersGrowth}
        />
        <StatCard
          title="Average Order Value"
          value={formatCurrency(data.summary.averageOrderValue)}
          icon={TrendingUp}
        />
        <StatCard
          title="New Customers"
          value={data.summary.newCustomers}
          icon={Users}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">
                  {data.summary.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold">
                  {data.summary.pendingOrders}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Discount</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.summary.totalDiscount)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Completed Orders
                </p>
                <p className="text-2xl font-bold">
                  {data.summary.completedOrders}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>
              Daily revenue for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.dailyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "Revenue",
                  ]}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("en-IN", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders Over Time</CardTitle>
            <CardDescription>
              Daily orders for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [value, "Orders"]}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString("en-IN", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <Bar dataKey="orders" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Order Status & Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Breakdown of orders by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.statusDistribution.filter((s) => s.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="status"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {data.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} orders`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {data.statusDistribution.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">
                    {item.status}: {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performers by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No sales data available
                </p>
              ) : (
                data.topProducts.slice(0, 5).map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity} units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(product.revenue)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest 10 orders</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No orders yet
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate">
                        {order.customer}
                      </TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(order.status)}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>Products with stock ≤ 10 units</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.lowStockProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      All products have sufficient stock
                    </TableCell>
                  </TableRow>
                ) : (
                  data.lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="max-w-[150px] truncate font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-right">
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
                          {product.stock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.price)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Footer with date range info */}
      <div className="text-center text-sm text-muted-foreground pb-4">
        Data shown for{" "}
        {new Date(data.dateRange.start).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}{" "}
        -{" "}
        {new Date(data.dateRange.end).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>
    </div>
  );
}
