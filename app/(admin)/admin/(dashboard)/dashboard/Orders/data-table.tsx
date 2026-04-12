"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { MoreHorizontalIcon, RefreshCw } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function DataTable() {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [counts, setCounts] = useState<{ pending: number; processing: number }>(
    {
      pending: 0,
      processing: 0,
    },
  );
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = 10;
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    let query = supabase.from("orders").select("*, order_items(id)");

    if (statusFilter === "all") {
      query = query.in("status", [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ]);
    } else {
      query = query.eq("status", statusFilter);
    }

    query = query.range(page * limit, page * limit + limit - 1);

    const { data, error } = await query;
    console.log("Fetched data:", data);
    if (!error && data) setData(data);
  }, [supabase, page, statusFilter]);

  const fetchCounts = useCallback(async () => {
    const [pendingResult, processingResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "processing"),
    ]);
    setCounts({
      pending: pendingResult.count || 0,
      processing: processingResult.count || 0,
    });
  }, [supabase]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshCooldown(5);
    await Promise.all([fetchData(), fetchCounts()]);
    setIsRefreshing(false);
  };

  // Cooldown timer
  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setTimeout(() => {
        setRefreshCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [refreshCooldown]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, data]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-4 border border-gray-300 p-4 rounded-lg">
      <div className="flex items-center justify-between gap-4">
        <Tabs
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(0);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">
              Pending{" "}
              {counts.pending > 0 && (
                <span className="ml-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {counts.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="processing">
              Processing{" "}
              {counts.processing > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {counts.processing}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="shipped">Shipped</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshCooldown > 0 || isRefreshing}
          className="shrink-0"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {refreshCooldown > 0 ? `Refresh (${refreshCooldown}s)` : "Refresh"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Products</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell
                onClick={() =>
                  window.open(`/admin/dashboard/Orders/${row.id}`, "_blank")
                }
                className="hover:underline hover:text-blue-600 cursor-pointer"
              >
                {row.id.slice(0, 8)}...
              </TableCell>
              <TableCell>{row.customer_name}</TableCell>
              <TableCell>{row.order_items?.length ?? 0}</TableCell>
              <TableCell>&#8377;{row.total}</TableCell>
              <TableCell>
                <Badge className={statusColors[row.status] || "bg-gray-100"}>
                  {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      aria-label="Open menu"
                      size="icon-sm"
                    >
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40" align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() =>
                          window.open(
                            `/admin/dashboard/Orders/${row.id}`,
                            "_blank",
                          )
                        }
                      >
                        View Order
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}

          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
