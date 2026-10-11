"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Check,
  X,
  Ban,
  RotateCcw,
  Search,
  RefreshCw,
  Users,
  Clock3,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";

type TabFilter = "all" | "pending" | "approved" | "rejected" | "suspended";

interface Affiliate {
  id: string;
  status: string;
  referral_code: string | null;
  created_at: string;
  customers: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
}

const STATUS_BADGES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-gray-100 text-gray-700",
};

const STATUS_LABELS: Record<TabFilter, string> = {
  all: "All affiliates",
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

const EMPTY_COUNTS: Record<TabFilter, number> = {
  all: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  suspended: 0,
};

function getAffiliateName(affiliate: Affiliate) {
  return (
    `${affiliate.customers?.first_name || ""} ${affiliate.customers?.last_name || ""}`.trim() ||
    "Unnamed applicant"
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DataTable() {
  const [data, setData] = useState<Affiliate[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<Record<TabFilter, number>>(EMPTY_COUNTS);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const limit = 10;

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status: activeTab,
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/admin/referrals/applications?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to load affiliates");
      setData(json.data || []);
      setTotalCount(json.count || 0);
      setCounts((current) => ({ ...current, [activeTab]: json.count || 0 }));
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load affiliates",
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchCounts() {
    try {
      const results = await Promise.all(
        (
          ["all", "pending", "approved", "rejected", "suspended"] as TabFilter[]
        ).map(async (status) => {
          const params = new URLSearchParams({ status, page: "0", limit: "1" });
          const res = await fetch(
            `/api/admin/referrals/applications?${params}`,
          );
          const json = await res.json();
          return [status, res.ok ? json.count || 0 : 0] as const;
        }),
      );
      setCounts(Object.fromEntries(results) as Record<TabFilter, number>);
    } catch {
      // The active list still provides a useful fallback when count requests fail.
    }
  }

  useEffect(() => {
    fetchData();
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page]);

  async function handleAction(id: string, action: string) {
    if (
      (action === "suspend" || action === "reinstate") &&
      !window.confirm(
        action === "suspend"
          ? "Suspend this affiliate? They will stop earning new commissions."
          : "Reinstate this affiliate?",
      )
    ) {
      return;
    }

    if (action === "reject") {
      const reason =
        window.prompt("Reason for rejection (optional):") || undefined;
      setActionId(id);
      try {
        const res = await fetch("/api/admin/referrals/applications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action, reason }),
        });
        if (!res.ok) throw new Error("Unable to update affiliate");
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Unable to update affiliate",
        );
      } finally {
        setActionId(null);
      }
    } else {
      setActionId(id);
      try {
        const res = await fetch("/api/admin/referrals/applications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action }),
        });
        if (!res.ok) throw new Error("Unable to update affiliate");
      } catch (actionError) {
        setError(
          actionError instanceof Error
            ? actionError.message
            : "Unable to update affiliate",
        );
      } finally {
        setActionId(null);
      }
    }
    await fetchData();
    await fetchCounts();
  }

  const totalPages = Math.ceil(totalCount / limit);
  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return data;
    return data.filter((affiliate) =>
      [
        getAffiliateName(affiliate),
        affiliate.customers?.phone,
        affiliate.referral_code,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    );
  }, [data, search]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wide">
              Total affiliates
            </span>
            <Users className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-950">
            {counts.all}
          </p>
          <p className="mt-1 text-xs text-gray-500">Across every status</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-medium uppercase tracking-wide">
              Needs review
            </span>
            <Clock3 className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-amber-950">
            {counts.pending}
          </p>
          <p className="mt-1 text-xs text-amber-800/70">Applications waiting</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-medium uppercase tracking-wide">
              Active
            </span>
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">
            {counts.approved}
          </p>
          <p className="mt-1 text-xs text-emerald-800/70">Approved partners</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-medium uppercase tracking-wide">
              Restricted
            </span>
            <Ban className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-gray-950">
            {counts.suspended}
          </p>
          <p className="mt-1 text-xs text-gray-500">Suspended partners</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as TabFilter);
            setPage(0);
            setSearch("");
          }}
        >
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-gray-100/80 p-1">
            {(
              [
                "all",
                "pending",
                "approved",
                "rejected",
                "suspended",
              ] as TabFilter[]
            ).map((status) => (
              <TabsTrigger key={status} value={status} className="gap-2">
                {STATUS_LABELS[status]}
                <span className="rounded-full bg-white/80 px-1.5 text-[11px] text-gray-500">
                  {counts[status]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search loaded results"
              className="pl-9"
              aria-label="Search loaded affiliate results"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              fetchData();
              fetchCounts();
            }}
            disabled={loading}
            aria-label="Refresh affiliates"
            title="Refresh"
          >
            <RefreshCw
              className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            />
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50/80">
            <TableRow>
              <TableHead className="font-semibold">Applicant</TableHead>
              <TableHead className="font-semibold">Referral code</TableHead>
              <TableHead className="font-semibold">Applied</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="w-20 text-right font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-gray-500"
                >
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  Loading affiliates...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-14 text-center text-gray-500"
                >
                  <Users className="mx-auto mb-2 h-6 w-6 text-gray-300" />
                  <p className="font-medium text-gray-700">
                    No affiliates found
                  </p>
                  <p className="mt-1 text-sm">
                    Try another status or search term.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((affiliate) => {
                const name = getAffiliateName(affiliate);
                return (
                  <TableRow key={affiliate.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                          {getInitials(name)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/dashboard/Affiliates/${affiliate.id}`}
                            className="font-medium text-gray-900 hover:underline"
                          >
                            {name}
                          </Link>
                          <p className="text-xs text-gray-500">
                            {affiliate.customers?.phone || "No phone number"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-600">
                      {affiliate.referral_code || (
                        <span className="font-sans text-gray-400">
                          Not assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-700">
                        {new Date(affiliate.created_at).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize ${STATUS_BADGES[affiliate.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {affiliate.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Actions for ${name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <Link
                            href={`/admin/dashboard/Affiliates/${affiliate.id}`}
                          >
                            <DropdownMenuItem className="cursor-pointer">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </Link>
                          {affiliate.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                disabled={actionId === affiliate.id}
                                onClick={() =>
                                  handleAction(affiliate.id, "approve")
                                }
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                disabled={actionId === affiliate.id}
                                onClick={() =>
                                  handleAction(affiliate.id, "reject")
                                }
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {affiliate.status === "approved" && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              disabled={actionId === affiliate.id}
                              onClick={() =>
                                handleAction(affiliate.id, "suspend")
                              }
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {affiliate.status === "suspended" && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              disabled={actionId === affiliate.id}
                              onClick={() =>
                                handleAction(affiliate.id, "reinstate")
                              }
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reinstate
                            </DropdownMenuItem>
                          )}
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {filteredData.length} of {totalCount} affiliates
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
