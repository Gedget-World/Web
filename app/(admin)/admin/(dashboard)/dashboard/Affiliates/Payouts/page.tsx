"use client";

import { useEffect, useState } from "react";
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
import { Loader2, ArrowLeft } from "lucide-react";
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
  const [selectedAffiliate, setSelectedAffiliate] =
    useState<PendingPayoutSummary | null>(null);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [payoutReference, setPayoutReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadSummary() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/referrals/payouts");
      const json = await res.json();
      setPending(json.pendingPayouts || []);
      setHistory(json.payouts || []);
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
    const res = await fetch(
      `/api/admin/referrals/payouts?affiliateId=${summary.affiliateId}`,
    );
    const json = await res.json();
    setCommissions(json.commissions || []);
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

  async function submitPayout() {
    if (!selectedAffiliate || selectedIds.size === 0) return;
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
      <div className="mx-4 my-2 space-y-4">
        <Button variant="ghost" onClick={() => setSelectedAffiliate(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Pay {selectedAffiliate.name}</CardTitle>
            <CardDescription>
              Select the confirmed commissions to include in this manual payout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      />
                    </TableCell>
                    <TableCell>{c.products?.name || "—"}</TableCell>
                    <TableCell>
                      {c.confirmed_at
                        ? new Date(c.confirmed_at).toLocaleDateString("en-IN")
                        : "—"}
                    </TableCell>
                    <TableCell>{formatCurrency(c.commission_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

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

            <div className="flex items-center justify-between pt-2">
              <p className="font-medium">
                Selected total: {formatCurrency(selectedTotal)}
              </p>
              <Button
                disabled={selectedIds.size === 0 || submitting}
                onClick={submitPayout}
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Mark as Paid
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-4 my-2 space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/dashboard/Affiliates")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Affiliates
        </Button>
        <h1 className="text-2xl font-bold mt-2">Affiliate Payouts</h1>
        <p className="text-sm text-gray-500">
          Affiliates with confirmed commissions awaiting a manual payout.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {pending.length === 0 ? (
            <p className="text-sm text-gray-500 p-6">No pending payouts.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Commissions Due</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((p) => (
                  <TableRow key={p.affiliateId}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.referralCode || "—"}
                    </TableCell>
                    <TableCell>{p.count}</TableCell>
                    <TableCell>{formatCurrency(p.totalDue)}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => openAffiliate(p)}>
                        Pay
                      </Button>
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
          <CardTitle className="text-base">Payout History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 p-6">
              No payouts recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reference</TableHead>
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
