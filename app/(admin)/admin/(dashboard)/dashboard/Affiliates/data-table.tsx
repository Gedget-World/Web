"use client";

import { useEffect, useState } from "react";
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

export function DataTable() {
  const [data, setData] = useState<Affiliate[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const limit = 10;

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: activeTab,
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/admin/referrals/applications?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setTotalCount(json.count || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page]);

  async function handleAction(id: string, action: string) {
    if (action === "reject") {
      const reason =
        window.prompt("Reason for rejection (optional):") || undefined;
      await fetch("/api/admin/referrals/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, reason }),
      });
    } else {
      await fetch("/api/admin/referrals/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
    }
    fetchData();
  }

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as TabFilter);
          setPage(0);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Phone</TableHead>
              <TableHead className="font-semibold">Referral Code</TableHead>
              <TableHead className="font-semibold">Applied</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  No affiliates found
                </TableCell>
              </TableRow>
            ) : (
              data.map((affiliate) => (
                <TableRow key={affiliate.id}>
                  <TableCell>
                    {affiliate.customers
                      ? `${affiliate.customers.first_name || ""} ${affiliate.customers.last_name || ""}`.trim() ||
                        "—"
                      : "—"}
                  </TableCell>
                  <TableCell>{affiliate.customers?.phone || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {affiliate.referral_code || "—"}
                  </TableCell>
                  <TableCell>
                    {new Date(affiliate.created_at).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGES[affiliate.status]}>
                      {affiliate.status}
                    </Badge>
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
                              onClick={() =>
                                handleAction(affiliate.id, "approve")
                              }
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {data.length} of {totalCount} affiliates
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
