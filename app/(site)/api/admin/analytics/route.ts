import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cookies } from "next/headers";

// Validate admin session
async function validateAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session_token")?.value;

  if (!sessionToken) {
    return false;
  }

  const supabase = createServiceClient();

  const { data: session, error } = await supabase
    .from("admin_sessions")
    .select("admin_id, expires_at")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session) {
    return false;
  }

  if (new Date(session.expires_at) < new Date()) {
    return false;
  }

  return true;
}

// Helper to get date range
function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case "7d":
      start.setDate(end.getDate() - 7);
      break;
    case "30d":
      start.setDate(end.getDate() - 30);
      break;
    case "90d":
      start.setDate(end.getDate() - 90);
      break;
    case "1y":
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    // Validate admin session
    const isAdmin = await validateAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "30d";
    const { start, end } = getDateRange(period);

    const supabase = createServiceClient();

    // Fetch all analytics data in parallel
    const [
      ordersResult,
      orderItemsResult,
      customersResult,
      productsResult,
      recentOrdersResult,
    ] = await Promise.all([
      // All orders in period
      supabase
        .from("orders")
        .select("id, total, status, created_at, discount, customer_id")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: true }),

      // Order items with product info
      supabase
        .from("order_items")
        .select(
          `
          id,
          quantity,
          price,
          product_id,
          order_id,
          orders!inner(created_at, status),
          products(name, price)
        `,
        )
        .gte("orders.created_at", start.toISOString())
        .lte("orders.created_at", end.toISOString()),

      // Customer count
      supabase
        .from("customers")
        .select("id, created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString()),

      // Total products
      supabase.from("products").select("id, name, price, stock, created_at"),

      // Recent orders
      supabase
        .from("orders")
        .select("id, total, status, created_at, customer_name, customer_email")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const orders = ordersResult.data || [];
    const orderItems = orderItemsResult.data || [];
    const customers = customersResult.data || [];
    const products = productsResult.data || [];
    const recentOrders = recentOrdersResult.data || [];

    // Calculate summary metrics
    const totalRevenue = orders
      .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
      .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

    const totalOrders = orders.length;
    const completedOrders = orders.filter(
      (o) => o.status === "delivered" || o.status === "completed",
    ).length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const cancelledOrders = orders.filter(
      (o) => o.status === "cancelled" || o.status === "refunded",
    ).length;

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const newCustomers = customers.length;
    const conversionRate =
      totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Calculate total discount given
    const totalDiscount = orders.reduce(
      (sum, o) => sum + (parseFloat(o.discount as string) || 0),
      0,
    );

    // Revenue by day
    const revenueByDay: Record<string, number> = {};
    const ordersByDay: Record<string, number> = {};

    orders.forEach((order) => {
      const date = new Date(order.created_at).toISOString().split("T")[0];
      if (order.status !== "cancelled" && order.status !== "refunded") {
        revenueByDay[date] =
          (revenueByDay[date] || 0) + parseFloat(order.total);
      }
      ordersByDay[date] = (ordersByDay[date] || 0) + 1;
    });

    // Create daily data array
    const dailyData: Array<{
      date: string;
      revenue: number;
      orders: number;
    }> = [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];
      dailyData.push({
        date: dateStr,
        revenue: Math.round((revenueByDay[dateStr] || 0) * 100) / 100,
        orders: ordersByDay[dateStr] || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Top selling products
    const productSales: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};

    orderItems.forEach((item: any) => {
      const productId = item.product_id;
      const productName = item.products?.name || "Unknown Product";
      const quantity = item.quantity || 0;
      const revenue = (item.price || 0) * quantity;

      if (!productSales[productId]) {
        productSales[productId] = {
          name: productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[productId].quantity += quantity;
      productSales[productId].revenue += revenue;
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({
        id,
        name: data.name,
        quantity: data.quantity,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Order status distribution
    const statusDistribution = [
      { status: "Pending", count: pendingOrders, color: "#fbbf24" },
      {
        status: "Processing",
        count: orders.filter((o) => o.status === "processing").length,
        color: "#3b82f6",
      },
      {
        status: "Shipped",
        count: orders.filter((o) => o.status === "shipped").length,
        color: "#8b5cf6",
      },
      { status: "Completed", count: completedOrders, color: "#22c55e" },
      { status: "Cancelled", count: cancelledOrders, color: "#ef4444" },
    ];

    // Revenue by status
    const revenueByStatus = statusDistribution.map((s) => ({
      status: s.status,
      revenue: orders
        .filter(
          (o) =>
            o.status === s.status.toLowerCase() ||
            (s.status === "Completed" &&
              (o.status === "delivered" || o.status === "completed")),
        )
        .reduce((sum, o) => sum + parseFloat(o.total), 0),
    }));

    // Low stock products
    const lowStockProducts = products
      .filter((p) => (p.stock || 0) <= 10)
      .sort((a, b) => (a.stock || 0) - (b.stock || 0))
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock || 0,
        price: p.price,
      }));

    // Previous period comparison
    const prevStart = new Date(start);
    const prevEnd = new Date(start);
    prevStart.setTime(start.getTime() - (end.getTime() - start.getTime()));

    const { data: prevOrders } = await supabase
      .from("orders")
      .select("total, status")
      .gte("created_at", prevStart.toISOString())
      .lt("created_at", start.toISOString());

    const prevRevenue = (prevOrders || [])
      .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
      .reduce((sum, o) => sum + parseFloat(o.total), 0);

    const prevOrderCount = (prevOrders || []).length;

    const revenueGrowth =
      prevRevenue > 0
        ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
        : totalRevenue > 0
          ? 100
          : 0;

    const ordersGrowth =
      prevOrderCount > 0
        ? ((totalOrders - prevOrderCount) / prevOrderCount) * 100
        : totalOrders > 0
          ? 100
          : 0;

    return NextResponse.json({
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        newCustomers,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        totalProducts: products.length,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        ordersGrowth: Math.round(ordersGrowth * 100) / 100,
      },
      dailyData,
      topProducts,
      statusDistribution,
      revenueByStatus,
      lowStockProducts,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        total: o.total,
        status: o.status,
        date: o.created_at,
        customer: o.customer_name || o.customer_email || "Guest",
      })),
      period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in analytics API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
