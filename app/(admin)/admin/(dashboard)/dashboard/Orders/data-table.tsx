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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { MoreHorizontalIcon, RefreshCw, Search, X } from "lucide-react";

// Full orders.status lifecycle (kept in sync with
// scripts/029_expand_order_status_and_shipment_tracking.sql's
// orders_status_check constraint).
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  payment_failed: "bg-orange-100 text-orange-800",
  processing: "bg-blue-100 text-blue-800",
  packed: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  return_requested: "bg-pink-100 text-pink-800",
  return_approved: "bg-pink-100 text-pink-800",
  return_rejected: "bg-red-100 text-red-800",
  return_in_transit: "bg-pink-100 text-pink-800",
  returned: "bg-gray-200 text-gray-800",
  rto: "bg-rose-100 text-rose-800",
  rto_received: "bg-rose-100 text-rose-800",
  refunded: "bg-teal-100 text-teal-800",
};

// Every "return"/RTO sub-status is grouped under a single "Returns" tab —
// with 16 possible statuses, surfacing each one as its own tab would be
// unusable. Admins can still see the precise status per-row in the table.
const RETURN_STATUSES = [
  "return_requested",
  "return_approved",
  "return_rejected",
  "return_in_transit",
  "returned",
  "rto",
  "rto_received",
];

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "payment_failed", label: "Payment Failed" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "returns", label: "Returns" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
];

// Tabs that surface a live count badge — the statuses that typically need
// admin attention/action rather than being a settled end-state.
const COUNT_BADGE_STATUSES = [
  "pending",
  "payment_failed",
  "processing",
  "returns",
];

const formatStatusLabel = (status: string) =>
  status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default function DataTable() {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const limit = 10;
  const supabase = createClient();

  const hasActiveFilters =
    statusFilter !== "all" ||
    paymentMethodFilter !== "all" ||
    sortBy !== "newest" ||
    search !== "" ||
    dateFrom !== "" ||
    dateTo !== "";

  const clearFilters = () => {
    setStatusFilter("all");
    setPaymentMethodFilter("all");
    setSortBy("newest");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  const fetchData = useCallback(async () => {
    let query = supabase.from("orders").select("*, order_items(id)");

    if (statusFilter === "returns") {
      query = query.in("status", RETURN_STATUSES);
    } else if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    // "all" intentionally applies no status filter, so any status
    // (including ones added later) still shows up here.

    if (paymentMethodFilter !== "all") {
      query = query.eq("payment_method", paymentMethodFilter);
    }

    if (dateFrom) {
      query = query.gte("created_at", `${dateFrom}T00:00:00`);
    }
    if (dateTo) {
      query = query.lte("created_at", `${dateTo}T23:59:59`);
    }

    if (debouncedSearch) {
      // Strip characters that would break the PostgREST or-filter syntax.
      const term = debouncedSearch.replace(/[%,()]/g, "");
      if (term) {
        query = query.or(
          `customer_name.ilike.%${term}%,customer_email.ilike.%${term}%,customer_phone.ilike.%${term}%,id::text.ilike.%${term}%`,
        );
      }
    }

    const [sortColumn, sortAscending] =
      sortBy === "oldest"
        ? (["created_at", true] as const)
        : sortBy === "amount_high"
          ? (["total", false] as const)
          : sortBy === "amount_low"
            ? (["total", true] as const)
            : (["created_at", false] as const);

    query = query
      .order(sortColumn, { ascending: sortAscending })
      .range(page * limit, page * limit + limit - 1);

    const { data, error } = await query;
    if (!error && data) setData(data);
  }, [
    supabase,
    page,
    statusFilter,
    paymentMethodFilter,
    sortBy,
    debouncedSearch,
    dateFrom,
    dateTo,
  ]);

  const fetchCounts = useCallback(async () => {
    const [
      pendingResult,
      paymentFailedResult,
      processingResult,
      returnsResult,
    ] = await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "payment_failed"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "processing"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", RETURN_STATUSES),
    ]);
    setCounts({
      pending: pendingResult.count || 0,
      payment_failed: paymentFailedResult.count || 0,
      processing: processingResult.count || 0,
      returns: returnsResult.count || 0,
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

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, data]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-4 border border-gray-300 p-4 rounded-lg">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, name, email, phone..."
            className="pl-8"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_TABS.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                <span className="flex items-center gap-2">
                  {tab.label}
                  {COUNT_BADGE_STATUSES.includes(tab.value) &&
                    (counts[tab.value] || 0) > 0 && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {counts[tab.value]}
                      </span>
                    )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={paymentMethodFilter}
          onValueChange={(value) => {
            setPaymentMethodFilter(value);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="cod">COD</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(value) => {
            setSortBy(value);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="amount_high">Amount: High to Low</SelectItem>
            <SelectItem value="amount_low">Amount: Low to High</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(0);
            }}
            className="w-[150px]"
            aria-label="From date"
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(0);
            }}
            className="w-[150px]"
            aria-label="To date"
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshCooldown > 0 || isRefreshing}
          className="shrink-0 ml-auto"
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
                  {formatStatusLabel(row.status)}
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
