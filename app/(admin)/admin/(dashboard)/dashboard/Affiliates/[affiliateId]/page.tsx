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
import {
  ArrowLeft,
  Loader2,
  Check,
  X,
  Ban,
  RotateCcw,
  Eye,
  Link2,
  Wallet,
  RefreshCw,
  Mail,
  Phone,
} from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);

  async function fetchDetail() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/referrals/${affiliateId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to load affiliate");
      setAffiliate(json.affiliate || null);
      setLinks(json.links || []);
      setCommissions(json.commissions || []);
      setPayouts(json.payouts || []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Unable to load affiliate",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [affiliateId]);

  async function handleAction(action: string) {
    if (
      (action === "suspend" || action === "reinstate") &&
      !window.confirm(
        action === "suspend"
          ? "Suspend this affiliate? They will stop earning new commissions."
          : "Reinstate this affiliate?",
      )
    )
      return;

    setUpdating(true);
    setError(null);
    try {
      const reason =
        action === "reject"
          ? window.prompt("Reason for rejection (optional):") || undefined
          : undefined;
      const res = await fetch("/api/admin/referrals/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: affiliateId, action, reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to update affiliate");
      await fetchDetail();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to update affiliate",
      );
    } finally {
      setUpdating(false);
    }
  }

  const totals = {
    clicks: links.reduce(
      (sum, link) => sum + Number(link.clicks_count || 0),
      0,
    ),
    earned: commissions.reduce(
      (sum, commission) => sum + Number(commission.commission_amount || 0),
      0,
    ),
    confirmed: commissions
      .filter((commission) => commission.status === "confirmed")
      .reduce(
        (sum, commission) => sum + Number(commission.commission_amount || 0),
        0,
      ),
    paid: payouts.reduce(
      (sum, payout) => sum + Number(payout.total_amount || 0),
      0,
    ),
  };

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
    <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-5 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          className="-ml-3"
          onClick={() => router.push("/admin/dashboard/Affiliates")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to affiliates
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchDetail}
          aria-label="Refresh affiliate"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <section className="rounded-2xl bg-gray-950 p-5 text-white shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-lg font-semibold text-gray-950">
              {name
                .split(" ")
                .filter(Boolean)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {name}
                </h1>
                <Badge
                  variant="outline"
                  className={`capitalize ${STATUS_BADGES[affiliate.status]}`}
                >
                  {affiliate.status}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {affiliate.email || "No email"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {affiliate.customers?.phone || "No phone"}
                </span>
              </div>
            </div>
          </div>
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
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          label="Referral links"
          value={String(links.length)}
          caption={`${totals.clicks} tracked clicks`}
          icon={Link2}
        />
        <Metric
          label="Commission earned"
          value={formatCurrency(totals.earned)}
          caption="Lifetime value"
          icon={Wallet}
        />
        <Metric
          label="Ready to pay"
          value={formatCurrency(totals.confirmed)}
          caption="Confirmed commissions"
          icon={Wallet}
        />
        <Metric
          label="Paid out"
          value={formatCurrency(totals.paid)}
          caption={`${payouts.length} payout records`}
          icon={Check}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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

function Metric({
  label,
  value,
  caption,
  icon: Icon,
}: {
  label: string;
  value: string;
  caption: string;
  icon: typeof Link2;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-gray-500">
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-xl font-semibold text-gray-950">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{caption}</p>
    </div>
  );
}
