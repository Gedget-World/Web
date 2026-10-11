"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  IndianRupee,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PendingPayoutSummary {
  affiliateId: string;
  name: string;
  referralCode: string | null;
  totalDue: number;
  count: number;
}

interface CommissionRow {
  id: string;
  commission_amount: number;
  confirmed_at: string | null;
  products: { name: string } | null;
}

interface PayoutRecord {
  id: string;
  total_amount: number;
  payout_reference: string | null;
  created_at: string;
  affiliates: {
    referral_code: string | null;
    customers: { first_name: string | null; last_name: string | null } | null;
  } | null;
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function PayoutsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState<PendingPayoutSummary[]>([]);
  const [history, setHistory] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] =
    useState<PendingPayoutSummary | null>(null);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [payoutReference, setPayoutReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingCommissions, setLoadingCommissions] = useState(false);

  async function loadSummary() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/referrals/payouts");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to load payouts");
      setPending(json.pendingPayouts || []);
      setHistory(json.payouts || []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load payouts",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  async function openAffiliate(summary: PendingPayoutSummary) {
    setSelectedAffiliate(summary);
    setSelectedIds(new Set());
    setLoadingCommissions(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/referrals/payouts?affiliateId=${summary.affiliateId}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Unable to load commissions");
      setCommissions(json.commissions || []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load commissions",
      );
      setCommissions([]);
    } finally {
      setLoadingCommissions(false);
    }
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(commissions.map((c) => c.id)) : new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const selectedTotal = commissions
    .filter((c) => selectedIds.has(c.id))
    .reduce((sum, c) => sum + Number(c.commission_amount), 0);

  const pendingTotal = pending.reduce(
    (sum, item) => sum + Number(item.totalDue),
    0,
  );
  const paidTotal = history.reduce(
    (sum, payout) => sum + Number(payout.total_amount),
    0,
  );
  const filteredPending = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pending;
    return pending.filter((item) =>
      [item.name, item.referralCode]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [pending, search]);

  async function submitPayout() {
    if (!selectedAffiliate || selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Mark ${formatCurrency(selectedTotal)} as paid to ${selectedAffiliate.name}?`,
      )
    )
      return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/referrals/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: selectedAffiliate.affiliateId,
          commissionIds: Array.from(selectedIds),
          payoutMethod: "manual",
          payoutReference,
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({
          title: "Failed",
          description: json.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Payout recorded",
        description: `${formatCurrency(selectedTotal)} marked as paid.`,
      });
      setSelectedAffiliate(null);
      setPayoutReference("");
      setNotes("");
      loadSummary();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (selectedAffiliate) {
    return (
      <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-5 lg:px-6">
        <Button
          variant="ghost"
          className="-ml-3"
          onClick={() => setSelectedAffiliate(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to payout queue
        </Button>
        <div className="flex flex-col gap-4 rounded-2xl bg-gray-950 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-sm text-gray-400">Prepare manual payout</p>
            <h1 className="mt-1 text-2xl font-semibold">
              {selectedAffiliate.name}
            </h1>
            <p className="mt-1 font-mono text-xs text-gray-400">
              {selectedAffiliate.referralCode || "No referral code"}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-sm text-gray-400">Available balance</p>
            <p className="text-2xl font-semibold">
              {formatCurrency(selectedAffiliate.totalDue)}
            </p>
          </div>
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Select commissions</CardTitle>
            <CardDescription>
              Only confirmed commissions can be included in this payout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingCommissions ? (
              <div className="py-10 text-center text-sm text-gray-500">
                <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                Loading commissions...
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            selectedIds.size === commissions.length &&
                            commissions.length > 0
                          }
                          onCheckedChange={(v) => toggleAll(Boolean(v))}
                          aria-label="Select all commissions"
                        />
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Confirmed</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(c.id)}
                            onCheckedChange={(v) => toggleOne(c.id, Boolean(v))}
                            aria-label={`Select ${c.products?.name || "commission"}`}
                          />
                        </TableCell>
                        <TableCell>{c.products?.name || "—"}</TableCell>
                        <TableCell>
                          {c.confirmed_at
                            ? new Date(c.confirmed_at).toLocaleDateString(
                                "en-IN",
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(c.commission_amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Payout reference (bank/UPI txn id)"
                value={payoutReference}
                onChange={(e) => setPayoutReference(e.target.value)}
              />
              <Input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {selectedIds.size} commission
                  {selectedIds.size === 1 ? "" : "s"} selected
                </p>
                <p className="text-xl font-semibold">
                  {formatCurrency(selectedTotal)}
                </p>
              </div>
              <Button
                disabled={selectedIds.size === 0 || submitting}
                onClick={submitPayout}
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as paid
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 px-4 py-5 lg:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() => router.push("/admin/dashboard/Affiliates")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to affiliates
          </Button>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Affiliate payouts
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review confirmed commissions and record manual payments.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={loadSummary}
          disabled={loading}
          aria-label="Refresh payouts"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Metric
          label="Awaiting payout"
          value={formatCurrency(pendingTotal)}
          caption={`${pending.length} affiliates in queue`}
          icon={Clock3}
        />
        <Metric
          label="Commissions due"
          value={String(pending.reduce((sum, item) => sum + item.count, 0))}
          caption="Confirmed items"
          icon={IndianRupee}
        />
        <Metric
          label="Paid to date"
          value={formatCurrency(paidTotal)}
          caption={`${history.length} recorded payouts`}
          icon={Wallet}
        />
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Payout queue</CardTitle>
            <CardDescription>
              Select an affiliate to review and pay confirmed commissions.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search affiliates"
              className="pl-9"
              aria-label="Search payout queue"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPending.length === 0 ? (
            <EmptyState
              text={
                pending.length === 0
                  ? "No payouts are waiting for approval."
                  : "No payout matches your search."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Commissions Due</TableHead>
                    <TableHead>Amount due</TableHead>
                    <TableHead className="w-24 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPending.map((p) => (
                    <TableRow key={p.affiliateId}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {p.referralCode || "—"}
                      </TableCell>
                      <TableCell>{p.count}</TableCell>
                      <TableCell>{formatCurrency(p.totalDue)}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => openAffiliate(p)}>
                          Review{" "}
                          <ArrowLeft className="ml-2 h-3.5 w-3.5 rotate-180" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Payout history</CardTitle>
          <CardDescription>
            Manual payouts already marked as paid.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <EmptyState text="No payouts recorded yet." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/80">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {new Date(p.created_at).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell>
                        {p.affiliates?.customers
                          ? `${p.affiliates.customers.first_name || ""} ${p.affiliates.customers.last_name || ""}`.trim()
                          : "—"}
                      </TableCell>
                      <TableCell>{formatCurrency(p.total_amount)}</TableCell>
                      <TableCell>{p.payout_reference || "—"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" /> Paid
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
  icon: typeof Clock3;
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center text-sm text-gray-500">
      <Wallet className="h-6 w-6 text-gray-300" />
      {text}
    </div>
  );
}
