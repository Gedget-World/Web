"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2, Check, X, Ban, RotateCcw } from "lucide-react";
import type {
  Affiliate,
  CommissionPayout,
  ReferralCommission,
} from "@/lib/types/referrals";

type AffiliateDetail = Affiliate & {
  email: string | null;
  customers: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
};

type LinkRow = {
  id: string;
  link_code: string;
  clicks_count: number;
  created_at: string;
  products: { name: string; slug: string } | null;
};

type CommissionRow = ReferralCommission & { products: { name: string } | null };

const STATUS_BADGES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  reversed: "bg-red-100 text-red-800",
  ineligible_self_referral: "bg-gray-100 text-gray-600",
};

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function AffiliateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const affiliateId = params.affiliateId as string;

  const [affiliate, setAffiliate] = useState<AffiliateDetail | null>(null);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [payouts, setPayouts] = useState<CommissionPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/referrals/${affiliateId}`);
      const json = await res.json();
      setAffiliate(json.affiliate || null);
      setLinks(json.links || []);
      setCommissions(json.commissions || []);
      setPayouts(json.payouts || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [affiliateId]);

  async function handleAction(action: string) {
    setUpdating(true);
    try {
      const reason =
        action === "reject"
          ? window.prompt("Reason for rejection (optional):") || undefined
          : undefined;
      await fetch("/api/admin/referrals/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: affiliateId, action, reason }),
      });
      await fetchDetail();
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="mx-4 my-2">
        <p className="text-gray-500">Affiliate not found.</p>
      </div>
    );
  }

  const name =
    `${affiliate.customers?.first_name || ""} ${affiliate.customers?.last_name || ""}`.trim() ||
    "—";

  return (
    <div className="mx-4 my-2 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/dashboard/Affiliates")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          {affiliate.status === "pending" && (
            <>
              <Button
                disabled={updating}
                onClick={() => handleAction("approve")}
              >
                <Check className="h-4 w-4 mr-2" /> Approve
              </Button>
              <Button
                variant="destructive"
                disabled={updating}
                onClick={() => handleAction("reject")}
              >
                <X className="h-4 w-4 mr-2" /> Reject
              </Button>
            </>
          )}
          {affiliate.status === "approved" && (
            <Button
              variant="destructive"
              disabled={updating}
              onClick={() => handleAction("suspend")}
            >
              <Ban className="h-4 w-4 mr-2" /> Suspend
            </Button>
          )}
          {affiliate.status === "suspended" && (
            <Button
              disabled={updating}
              onClick={() => handleAction("reinstate")}
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Reinstate
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {name}
              <Badge className={STATUS_BADGES[affiliate.status]}>
                {affiliate.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-gray-500">Email:</span>{" "}
              {affiliate.email || "—"}
            </p>
            <p>
              <span className="text-gray-500">Phone:</span>{" "}
              {affiliate.customers?.phone || "—"}
            </p>
            <p>
              <span className="text-gray-500">Referral Code:</span>{" "}
              {affiliate.referral_code || "—"}
            </p>
            <p>
              <span className="text-gray-500">Applied:</span>{" "}
              {new Date(affiliate.created_at).toLocaleDateString("en-IN")}
            </p>
            {affiliate.application_message && (
              <p className="pt-2">
                <span className="text-gray-500">Message:</span>{" "}
                {affiliate.application_message}
              </p>
            )}
            {affiliate.rejected_reason && (
              <p className="pt-2 text-red-600">
                Rejected: {affiliate.rejected_reason}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payout Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm capitalize">
            <p>
              <span className="text-gray-500 lowercase">Method:</span>{" "}
              {affiliate.payout_method?.replace(/_/g, " ") || "—"}
            </p>
            {affiliate.payout_method === "upi" && (
              <p className="normal-case">
                <span className="text-gray-500">UPI ID:</span>{" "}
                {affiliate.payout_details?.upi_id || "—"}
              </p>
            )}
            {affiliate.payout_method === "bank_transfer" && (
              <div className="normal-case space-y-1">
                <p>
                  <span className="text-gray-500">Holder:</span>{" "}
                  {affiliate.payout_details?.account_holder_name || "—"}
                </p>
                <p>
                  <span className="text-gray-500">Account:</span>{" "}
                  {affiliate.payout_details?.account_number || "—"}
                </p>
                <p>
                  <span className="text-gray-500">IFSC:</span>{" "}
                  {affiliate.payout_details?.ifsc_code || "—"}
                </p>
                <p>
                  <span className="text-gray-500">Bank:</span>{" "}
                  {affiliate.payout_details?.bank_name || "—"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Referral Links ({links.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {links.length === 0 ? (
            <p className="text-sm text-gray-500 p-6">No links created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>{link.products?.name || "—"}</TableCell>
                    <TableCell>{link.clicks_count}</TableCell>
                    <TableCell>
                      {new Date(link.created_at).toLocaleDateString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Commissions ({commissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {commissions.length === 0 ? (
            <p className="text-sm text-gray-500 p-6">No commissions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {new Date(c.created_at).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>{c.products?.name || "—"}</TableCell>
                    <TableCell>{formatCurrency(c.commission_amount)}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGES[c.status]}>
                        {c.status.replace(/_/g, " ")}
                        {c.needs_clawback && " ⚠"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Payout History ({payouts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payouts.length === 0 ? (
            <p className="text-sm text-gray-500 p-6">No payouts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {new Date(p.created_at).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>{formatCurrency(p.total_amount)}</TableCell>
                    <TableCell>{p.payout_reference || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
