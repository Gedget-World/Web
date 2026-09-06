"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Copy,
  Check,
  Link2,
  Package,
  Wallet,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "@/hooks/use-search";
import type {
  Affiliate,
  CommissionPayout,
  PayoutDetails,
  PayoutMethod,
  ReferralCommission,
} from "@/lib/types/referrals";

type ReferralLinkWithProduct = {
  id: string;
  product_id: string;
  link_code: string;
  clicks_count: number;
  created_at: string;
  products: {
    name: string;
    slug: string;
    image_url: string | null;
    price: number;
  } | null;
};

type CommissionWithProduct = ReferralCommission & {
  products: { name: string; slug: string; image_url: string | null } | null;
};

const STATUS_BADGES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  reversed: "bg-red-100 text-red-800",
  ineligible_self_referral: "bg-gray-100 text-gray-600",
};

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function AffiliateDashboardClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalOrders: 0,
    pendingAmount: 0,
    confirmedAmount: 0,
    paidAmount: 0,
    lifetimeEarnings: 0,
  });
  const [commissions, setCommissions] = useState<CommissionWithProduct[]>([]);
  const [payouts, setPayouts] = useState<CommissionPayout[]>([]);
  const [links, setLinks] = useState<ReferralLinkWithProduct[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await fetch("/api/referrals/dashboard");
      const data = await res.json();
      setAffiliate(data.affiliate || null);
      if (data.stats) setStats(data.stats);
      setCommissions(data.commissions || []);
      setPayouts(data.payouts || []);
      if (data.affiliate?.status === "approved") {
        const linksRes = await fetch("/api/referrals/links");
        const linksData = await linksRes.json();
        setLinks(linksData.links || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function copyLink(linkCode: string, slug: string) {
    const url = `${window.location.origin}/products/${slug}?ref=${linkCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(linkCode);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard.",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Link2 className="h-6 w-6 text-indigo-600" />
          Affiliate Program
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Share product links, earn a commission on every sale they bring in.
        </p>
      </div>

      {!affiliate && <ApplicationForm onSubmitted={loadDashboard} />}
      {affiliate?.status === "pending" && (
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-medium">Application under review</p>
              <p className="text-sm text-slate-500">
                We&apos;ll notify you once an admin approves your application.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {affiliate?.status === "rejected" && (
        <div className="space-y-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="font-medium text-red-900">Application rejected</p>
              {affiliate.rejected_reason && (
                <p className="text-sm text-red-700 mt-1">
                  {affiliate.rejected_reason}
                </p>
              )}
            </CardContent>
          </Card>
          <ApplicationForm onSubmitted={loadDashboard} />
        </div>
      )}
      {affiliate?.status === "suspended" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="font-medium text-red-900">
              Your affiliate account is suspended
            </p>
            <p className="text-sm text-red-700 mt-1">
              Contact support if you believe this is a mistake.
            </p>
          </CardContent>
        </Card>
      )}

      {affiliate?.status === "approved" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Clicks" value={String(stats.totalClicks)} />
            <StatCard label="Orders" value={String(stats.totalOrders)} />
            <StatCard
              label="Pending"
              value={formatCurrency(stats.pendingAmount)}
            />
            <StatCard
              label="Confirmed"
              value={formatCurrency(stats.confirmedAmount)}
            />
            <StatCard label="Paid" value={formatCurrency(stats.paidAmount)} />
            <StatCard
              label="Lifetime"
              value={formatCurrency(stats.lifetimeEarnings)}
              highlight
            />
          </div>

          <Tabs defaultValue="links">
            <TabsList>
              <TabsTrigger value="links">My Links</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>

            <TabsContent value="links" className="space-y-6 mt-4">
              <ProductPicker
                existingProductIds={new Set(links.map((l) => l.product_id))}
                onLinkCreated={(link) => setLinks((prev) => [link, ...prev])}
              />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Your Referral Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {links.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4">
                      No links yet — pick a product above to generate one.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Clicks</TableHead>
                          <TableHead>Link</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {links.map((link) => (
                          <TableRow key={link.id}>
                            <TableCell>
                              {link.products?.name || "Unknown product"}
                            </TableCell>
                            <TableCell>{link.clicks_count}</TableCell>
                            <TableCell className="font-mono text-xs text-slate-500 max-w-[220px] truncate">
                              /products/{link.products?.slug}?ref=
                              {link.link_code}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  link.products &&
                                  copyLink(link.link_code, link.products.slug)
                                }
                              >
                                {copiedCode === link.link_code ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commissions" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {commissions.length === 0 ? (
                    <p className="text-sm text-slate-500 p-6">
                      No commissions yet.
                    </p>
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
                              {new Date(c.created_at).toLocaleDateString(
                                "en-IN",
                              )}
                            </TableCell>
                            <TableCell>{c.products?.name || "—"}</TableCell>
                            <TableCell>
                              {formatCurrency(c.commission_amount)}
                            </TableCell>
                            <TableCell>
                              <Badge className={STATUS_BADGES[c.status]}>
                                {c.status.replace(/_/g, " ")}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {payouts.length === 0 ? (
                    <p className="text-sm text-slate-500 p-6">
                      No payouts yet.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              {new Date(p.created_at).toLocaleDateString(
                                "en-IN",
                              )}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(p.total_amount)}
                            </TableCell>
                            <TableCell className="capitalize">
                              {p.payout_method?.replace(/_/g, " ") || "—"}
                            </TableCell>
                            <TableCell>{p.payout_reference || "—"}</TableCell>
                            <TableCell>
                              <Badge className={STATUS_BADGES[p.status] || ""}>
                                {p.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-indigo-300 bg-indigo-50" : ""}>
      <CardContent className="p-4">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ApplicationForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("upi");
  const [payoutDetails, setPayoutDetails] = useState<PayoutDetails>({});

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/referrals/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, payoutMethod, payoutDetails }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Could not submit application",
          description: data.error || "Please try again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Application submitted",
        description: "We'll review it shortly.",
      });
      onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join the Affiliate Program</CardTitle>
        <CardDescription>
          Apply once, then generate referral links for any product and earn a
          commission on every sale made through your link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">
            Tell us how you plan to promote products (optional)
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. I run a tech review Instagram page with 10k followers"
            rows={3}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            Payout method
          </label>
          <Select
            value={payoutMethod}
            onValueChange={(v) => setPayoutMethod(v as PayoutMethod)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {payoutMethod === "upi" ? (
          <Input
            placeholder="UPI ID (e.g. name@bank)"
            value={payoutDetails.upi_id || ""}
            onChange={(e) => setPayoutDetails({ upi_id: e.target.value })}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Account holder name"
              value={payoutDetails.account_holder_name || ""}
              onChange={(e) =>
                setPayoutDetails((d) => ({
                  ...d,
                  account_holder_name: e.target.value,
                }))
              }
            />
            <Input
              placeholder="Account number"
              value={payoutDetails.account_number || ""}
              onChange={(e) =>
                setPayoutDetails((d) => ({
                  ...d,
                  account_number: e.target.value,
                }))
              }
            />
            <Input
              placeholder="IFSC code"
              value={payoutDetails.ifsc_code || ""}
              onChange={(e) =>
                setPayoutDetails((d) => ({ ...d, ifsc_code: e.target.value }))
              }
            />
            <Input
              placeholder="Bank name (optional)"
              value={payoutDetails.bank_name || ""}
              onChange={(e) =>
                setPayoutDetails((d) => ({ ...d, bank_name: e.target.value }))
              }
            />
          </div>
        )}
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Submit Application
        </Button>
      </CardContent>
    </Card>
  );
}

function ProductPicker({
  existingProductIds,
  onLinkCreated,
}: {
  existingProductIds: Set<string>;
  onLinkCreated: (link: ReferralLinkWithProduct) => void;
}) {
  const { toast } = useToast();
  const { query, setQuery, results, loading } = useSearch({
    initialSortBy: "newest",
    pageSize: 8,
  });
  const [creatingId, setCreatingId] = useState<string | null>(null);

  async function createLink(productId: string) {
    setCreatingId(productId);
    try {
      const res = await fetch("/api/referrals/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: "Could not create link",
          description: data.error || "Please try again.",
          variant: "destructive",
        });
        return;
      }
      onLinkCreated(data.link);
      toast({
        title: "Link created",
        description: "Find it in the table below.",
      });
    } finally {
      setCreatingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Create a Referral Link</CardTitle>
        <CardDescription>
          Search for a product to generate a shareable link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
        {results && results.items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {results.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border rounded-lg p-2"
              >
                <div className="h-10 w-10 rounded bg-slate-100 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    ₹{item.price.toLocaleString("en-IN")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={
                    existingProductIds.has(item.id) ? "outline" : "default"
                  }
                  disabled={
                    existingProductIds.has(item.id) || creatingId === item.id
                  }
                  onClick={() => createLink(item.id)}
                >
                  {existingProductIds.has(item.id) ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" /> Linked
                    </>
                  ) : creatingId === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Wallet className="h-3.5 w-3.5 mr-1" /> Get Link
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
