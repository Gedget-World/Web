"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Loader2,
  Copy,
  Check,
  Link2,
  Package,
  Wallet,
  Clock,
  Search,
  Share2,
  MousePointerClick,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Receipt,
  WalletCards,
  CalendarDays,
  ShoppingBag,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  BadgeIndianRupee,
  Megaphone,
  ShieldCheck,
  AlertTriangle,
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
  const [linksPage, setLinksPage] = useState(0);
  const linksPerPage = 6;
  const [commissionsPage, setCommissionsPage] = useState(0);
  const [payoutsPage, setPayoutsPage] = useState(0);
  const historyPerPage = 6;

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
    <div className="min-h-[calc(100vh-180px)] bg-slate-50/70">
      <div className="container mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-8 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
            <Link2 className="h-3.5 w-3.5" />
            Partner with Gadgets Kabila
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            Turn your recommendations into rewards.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 md:text-base">
            Share products you genuinely love with your audience and earn when
            they shop through your personal links.
          </p>
        </div>

        <div className="space-y-6">
          {!affiliate && <ApplicationForm onSubmitted={loadDashboard} />}
          {affiliate?.status === "pending" && <ApplicationStatus />}
          {affiliate?.status === "rejected" && (
            <div className="space-y-4">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <p className="font-medium text-red-900">
                    Application rejected
                  </p>
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
          {affiliate?.status === "suspended" && <SuspendedStatus />}

          {affiliate?.status === "approved" && (
            <div className="space-y-6">
              <PerformanceOverview stats={stats} />

              <Tabs defaultValue="links">
                <TabsList>
                  <TabsTrigger value="links">My Links</TabsTrigger>
                  <TabsTrigger value="commissions">Commissions</TabsTrigger>
                  <TabsTrigger value="payouts">Payouts</TabsTrigger>
                </TabsList>

                <TabsContent value="links" className="space-y-6 mt-4">
                  <ProductPicker
                    existingProductIds={new Set(links.map((l) => l.product_id))}
                    onLinkCreated={(link) => {
                      setLinks((prev) => [link, ...prev]);
                      setLinksPage(0);
                    }}
                  />
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                            <Share2 className="h-4 w-4" />
                          </div>
                          <h2 className="font-semibold text-slate-900">
                            Your shareable links
                          </h2>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Copy a link and share it anywhere. You earn when
                          someone shops through it.
                        </p>
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        {links.length} {links.length === 1 ? "link" : "links"}
                      </Badge>
                    </div>
                    {links.length === 0 ? (
                      <div className="flex flex-col items-center px-6 py-12 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                          <Link2 className="h-6 w-6" />
                        </div>
                        <h3 className="mt-4 font-medium text-slate-900">
                          Your first link is one product away
                        </h3>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                          Choose a product above, create your link, and share it
                          with your audience.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="divide-y divide-slate-100">
                          {links
                            .slice(
                              linksPage * linksPerPage,
                              (linksPage + 1) * linksPerPage,
                            )
                            .map((link) => {
                              const productName =
                                link.products?.name || "Unknown product";
                              const productSlug = link.products?.slug;
                              return (
                                <div
                                  key={link.id}
                                  className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                      {link.products?.image_url ? (
                                        <Image
                                          src={link.products.image_url}
                                          alt=""
                                          fill
                                          sizes="56px"
                                          className="object-contain"
                                        />
                                      ) : (
                                        <Package className="absolute inset-0 m-auto h-5 w-5 text-slate-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate font-medium text-slate-900">
                                        {productName}
                                      </p>
                                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                        <MousePointerClick className="h-3.5 w-3.5" />
                                        {link.clicks_count} clicks
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-3 sm:min-w-[360px] sm:flex-row sm:items-center sm:justify-end">
                                    <code className="min-w-0 truncate rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 sm:max-w-[230px]">
                                      /products/{productSlug}?ref=
                                      {link.link_code}
                                    </code>
                                    <div className="flex shrink-0 gap-2">
                                      {productSlug && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          asChild
                                          title="Open product page"
                                        >
                                          <Link
                                            href={`/products/${productSlug}`}
                                          >
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            View
                                          </Link>
                                        </Button>
                                      )}
                                      {productSlug && (
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            copyLink(
                                              link.link_code,
                                              productSlug,
                                            )
                                          }
                                        >
                                          {copiedCode === link.link_code ? (
                                            <Check className="mr-2 h-4 w-4" />
                                          ) : (
                                            <Copy className="mr-2 h-4 w-4" />
                                          )}
                                          {copiedCode === link.link_code
                                            ? "Copied"
                                            : "Copy link"}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                        {Math.ceil(links.length / linksPerPage) > 1 && (
                          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                            <span>
                              Showing {linksPage * linksPerPage + 1}-
                              {Math.min(
                                (linksPage + 1) * linksPerPage,
                                links.length,
                              )}{" "}
                              of {links.length} links
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setLinksPage((page) => Math.max(0, page - 1))
                                }
                                disabled={linksPage === 0}
                              >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Previous
                              </Button>
                              <span className="min-w-[92px] text-center text-xs font-medium text-slate-600">
                                Page {linksPage + 1} of{" "}
                                {Math.ceil(links.length / linksPerPage)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setLinksPage((page) =>
                                    Math.min(
                                      Math.ceil(links.length / linksPerPage) -
                                        1,
                                      page + 1,
                                    ),
                                  )
                                }
                                disabled={
                                  linksPage >=
                                  Math.ceil(links.length / linksPerPage) - 1
                                }
                              >
                                Next
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="commissions" className="mt-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <HistoryHeader
                      icon={<Receipt className="h-4 w-4" />}
                      title="Your commissions"
                      description="Track the commission earned from each referred order."
                      count={commissions.length}
                      countLabel="commission"
                      tone="emerald"
                    />
                    {commissions.length === 0 ? (
                      <HistoryEmpty
                        icon={<Receipt className="h-6 w-6" />}
                        title="Your earnings will appear here"
                        description="Share a referral link and your commission activity will show up here after an order is placed."
                      />
                    ) : (
                      <>
                        <div className="divide-y divide-slate-100">
                          {commissions
                            .slice(
                              commissionsPage * historyPerPage,
                              (commissionsPage + 1) * historyPerPage,
                            )
                            .map((commission) => (
                              <div
                                key={commission.id}
                                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 text-emerald-700">
                                    {commission.products?.image_url ? (
                                      <Image
                                        src={commission.products.image_url}
                                        alt=""
                                        fill
                                        sizes="48px"
                                        className="object-contain"
                                      />
                                    ) : (
                                      <Receipt className="h-5 w-5" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-slate-900">
                                      {commission.products?.name ||
                                        "Product commission"}
                                    </p>
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                      <CalendarDays className="h-3.5 w-3.5" />
                                      {new Date(
                                        commission.created_at,
                                      ).toLocaleDateString("en-IN")}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-4 sm:justify-end">
                                  <Badge
                                    className={
                                      STATUS_BADGES[commission.status] ||
                                      "bg-slate-100 text-slate-700"
                                    }
                                  >
                                    {commission.status.replace(/_/g, " ")}
                                  </Badge>
                                  <p className="min-w-[100px] text-right text-base font-semibold text-emerald-700">
                                    {formatCurrency(
                                      commission.commission_amount,
                                    )}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                        <HistoryPagination
                          page={commissionsPage}
                          onPageChange={setCommissionsPage}
                          total={commissions.length}
                          perPage={historyPerPage}
                          itemLabel="commissions"
                        />
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="payouts" className="mt-4">
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <HistoryHeader
                      icon={<WalletCards className="h-4 w-4" />}
                      title="Your payouts"
                      description="See the payouts sent to your selected payment method."
                      count={payouts.length}
                      countLabel="payout"
                      tone="sky"
                    />
                    {payouts.length === 0 ? (
                      <HistoryEmpty
                        icon={<WalletCards className="h-6 w-6" />}
                        title="No payouts yet"
                        description="Once your confirmed commissions are paid, the details will appear here."
                      />
                    ) : (
                      <>
                        <div className="divide-y divide-slate-100">
                          {payouts
                            .slice(
                              payoutsPage * historyPerPage,
                              (payoutsPage + 1) * historyPerPage,
                            )
                            .map((payout) => (
                              <div
                                key={payout.id}
                                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                                    <WalletCards className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-900">
                                      {formatCurrency(payout.total_amount)}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                      <span className="capitalize">
                                        {payout.payout_method?.replace(
                                          /_/g,
                                          " ",
                                        ) || "Payment method unavailable"}
                                      </span>
                                      <span aria-hidden="true">•</span>
                                      <span>
                                        {new Date(
                                          payout.created_at,
                                        ).toLocaleDateString("en-IN")}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-4 sm:justify-end">
                                  <div className="text-right text-xs text-slate-500">
                                    <p>Reference</p>
                                    <p className="mt-1 max-w-[180px] truncate font-mono text-slate-700">
                                      {payout.payout_reference ||
                                        "Not provided"}
                                    </p>
                                  </div>
                                  <Badge
                                    className={
                                      STATUS_BADGES[payout.status] ||
                                      "bg-slate-100 text-slate-700"
                                    }
                                  >
                                    {payout.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                        <HistoryPagination
                          page={payoutsPage}
                          onPageChange={setPayoutsPage}
                          total={payouts.length}
                          perPage={historyPerPage}
                          itemLabel="payouts"
                        />
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryHeader({
  icon,
  title,
  description,
  count,
  countLabel,
  tone,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  count: number;
  countLabel: string;
  tone: "emerald" | "sky";
}) {
  const toneClasses =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-sky-100 text-sky-700";

  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneClasses}`}
          >
            {icon}
          </div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <Badge variant="secondary" className="w-fit">
        {count} {count === 1 ? countLabel : `${countLabel}s`}
      </Badge>
    </div>
  );
}

function HistoryEmpty({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {icon}
      </div>
      <h3 className="mt-4 font-medium text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}

function HistoryPagination({
  page,
  onPageChange,
  total,
  perPage,
  itemLabel,
}: {
  page: number;
  onPageChange: (page: number) => void;
  total: number;
  perPage: number;
  itemLabel: string;
}) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Showing {page * perPage + 1}-{Math.min((page + 1) * perPage, total)} of{" "}
        {total} {itemLabel}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <span className="min-w-[92px] text-center text-xs font-medium text-slate-600">
          Page {page + 1} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function PerformanceOverview({
  stats,
}: {
  stats: {
    totalClicks: number;
    totalOrders: number;
    pendingAmount: number;
    confirmedAmount: number;
    paidAmount: number;
    lifetimeEarnings: number;
  };
}) {
  const conversionRate =
    stats.totalClicks > 0
      ? Math.min(100, (stats.totalOrders / stats.totalClicks) * 100)
      : 0;
  const paidShare =
    stats.lifetimeEarnings > 0
      ? Math.min(100, (stats.paidAmount / stats.lifetimeEarnings) * 100)
      : 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-sm">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_75%_45%,rgba(99,102,241,0.28),transparent_62%)]" />
      <div className="relative grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col justify-between gap-8 border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                Affiliate performance
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">
                Your earning journey
              </h2>
              <p className="mt-1 max-w-md text-sm text-slate-400">
                Every click is an opportunity. Here&apos;s how your shared links
                are turning attention into earnings.
              </p>
            </div>
            <div className="hidden rounded-full border border-white/10 bg-white/5 p-2.5 sm:block">
              <ArrowUpRight className="h-5 w-5 text-indigo-300" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <div
              className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#818cf8 ${paidShare}%, rgba(255,255,255,0.1) ${paidShare}% 100%)`,
              }}
            >
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-slate-950 text-center">
                <span className="text-xs text-slate-400">Lifetime earned</span>
                <span className="mt-1 text-2xl font-bold tracking-tight">
                  {formatCurrency(stats.lifetimeEarnings)}
                </span>
                <span className="mt-1 text-[11px] text-indigo-300">
                  {Math.round(paidShare)}% paid out
                </span>
              </div>
            </div>
            <div className="w-full max-w-xs space-y-4">
              <PerformanceMetric
                icon={<MousePointerClick className="h-4 w-4" />}
                label="Link clicks"
                value={String(stats.totalClicks)}
                detail="people reached your links"
                tone="indigo"
              />
              <PerformanceMetric
                icon={<ShoppingBag className="h-4 w-4" />}
                label="Orders generated"
                value={String(stats.totalOrders)}
                detail={`${conversionRate.toFixed(1)}% click-to-order rate`}
                tone="emerald"
              />
            </div>
          </div>
        </div>

        <div className="relative flex flex-col justify-center p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Earnings status</p>
              <p className="mt-1 text-xs text-slate-400">
                Money moving through your account
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-7 space-y-5">
            <EarningsStep
              label="Pending"
              amount={stats.pendingAmount}
              color="bg-amber-400"
              description="Under review"
            />
            <EarningsStep
              label="Confirmed"
              amount={stats.confirmedAmount}
              color="bg-sky-400"
              description="Ready for payout"
            />
            <EarningsStep
              label="Paid"
              amount={stats.paidAmount}
              color="bg-emerald-400"
              description="Sent to you"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PerformanceMetric({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "indigo" | "emerald";
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          tone === "indigo"
            ? "bg-indigo-400/15 text-indigo-300"
            : "bg-emerald-400/15 text-emerald-300"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">{value}</span>
          <span className="text-xs text-slate-300">{label}</span>
        </div>
        <p className="truncate text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

function EarningsStep({
  label,
  amount,
  color,
  description,
}: {
  label: string;
  amount: number;
  color: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-300">{label}</span>
          <span className="text-sm font-semibold text-white">
            {formatCurrency(amount)}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function ApplicationForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("upi");
  const [payoutDetails, setPayoutDetails] = useState<PayoutDetails>({});

  async function handleSubmit() {
    if (payoutMethod === "upi" && !payoutDetails.upi_id?.trim()) {
      toast({ title: "UPI ID is required", variant: "destructive" });
      return;
    }
    if (
      payoutMethod === "bank_transfer" &&
      (!payoutDetails.account_holder_name?.trim() ||
        !payoutDetails.account_number?.trim() ||
        !payoutDetails.ifsc_code?.trim())
    ) {
      toast({
        title: "Account holder name, account number and IFSC are required",
        variant: "destructive",
      });
      return;
    }
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
    <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative overflow-hidden bg-slate-950 p-7 text-white sm:p-9">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[24px] border-indigo-400/10" />
        <div className="absolute -bottom-24 -left-12 h-48 w-48 rounded-full border-[32px] border-emerald-400/10" />
        <div className="relative flex h-full flex-col justify-between gap-10">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
              <BadgeIndianRupee className="h-6 w-6" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
              Built for recommendations
            </p>
            <h2 className="mt-3 max-w-sm text-3xl font-semibold leading-tight tracking-tight">
              Share what you love. Get rewarded for the introduction.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              Once approved, you can create product links in seconds and track
              clicks, orders, and payouts from one simple dashboard.
            </p>
          </div>
          <div className="space-y-4">
            <ApplicationBenefit
              icon={<Megaphone className="h-4 w-4" />}
              title="Share anywhere"
              description="Social posts, groups, messages, or your own content."
            />
            <ApplicationBenefit
              icon={<BadgeIndianRupee className="h-4 w-4" />}
              title="Earn on referred orders"
              description="Your links connect your recommendations to rewards."
            />
            <ApplicationBenefit
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Simple, transparent tracking"
              description="See your activity and payout progress in one place."
            />
          </div>
        </div>
      </div>

      <div className="p-7 sm:p-9">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
            Step 1 of 1
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            Start your application
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Tell us a little about how you&apos;ll share products and where
            you&apos;d like to receive your earnings.
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                How will you promote products?
                <span className="ml-1 font-normal text-slate-400">
                  Optional
                </span>
              </label>
              <Textarea
                className="min-h-[110px] resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="For example: I run a tech review Instagram page with 10k followers."
                rows={4}
              />
              <p className="mt-2 text-xs text-slate-400">
                This helps us understand your audience and content.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Choose your payout method
              </label>
              <Select
                value={payoutMethod}
                onValueChange={(v) => setPayoutMethod(v as PayoutMethod)}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {payoutMethod === "upi" ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  UPI ID
                </label>
                <Input
                  className="h-11"
                  placeholder="name@bank"
                  value={payoutDetails.upi_id || ""}
                  onChange={(e) => setPayoutDetails({ upi_id: e.target.value })}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  className="h-11"
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
                  className="h-11"
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
                  className="h-11"
                  placeholder="IFSC code"
                  value={payoutDetails.ifsc_code || ""}
                  onChange={(e) =>
                    setPayoutDetails((d) => ({
                      ...d,
                      ifsc_code: e.target.value,
                    }))
                  }
                />
                <Input
                  className="h-11"
                  placeholder="Bank name (optional)"
                  value={payoutDetails.bank_name || ""}
                  onChange={(e) =>
                    setPayoutDetails((d) => ({
                      ...d,
                      bank_name: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-400">
                Applications are reviewed by our team before links become
                available.
              </p>
              <Button
                className="h-11 shrink-0 px-5"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Submit application
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationBenefit({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-indigo-300">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function ApplicationStatus() {
  return (
    <section className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden bg-amber-50 p-7 sm:p-9">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full border-[20px] border-amber-200/60" />
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Clock className="h-6 w-6" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Application received
            </p>
            <h2 className="mt-3 max-w-sm text-3xl font-bold tracking-tight text-slate-950">
              We&apos;re reviewing your application.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
              Your details are with our team now. We&apos;ll notify you as soon
              as your affiliate account is approved.
            </p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm ring-1 ring-amber-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              In review
            </div>
          </div>
        </div>

        <div className="p-7 sm:p-9">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Your progress
              </p>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                Almost ready to share and earn
              </h3>
            </div>
            <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-600" />
          </div>

          <div className="mt-8 space-y-0">
            <ApplicationStep
              number="01"
              title="Application submitted"
              description="Your information has been received successfully."
              complete
            />
            <ApplicationStep
              number="02"
              title="Team review"
              description="We are checking your promotion details and payout information."
              active
            />
            <ApplicationStep
              number="03"
              title="Affiliate access unlocked"
              description="Create links for products and start tracking your earnings."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ApplicationStep({
  number,
  title,
  description,
  complete,
  active,
}: {
  number: string;
  title: string;
  description: string;
  complete?: boolean;
  active?: boolean;
}) {
  return (
    <div className="relative flex gap-4 pb-7 last:pb-0">
      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white text-xs font-bold">
        {complete ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <span className={active ? "text-amber-600" : "text-slate-300"}>
            {number}
          </span>
        )}
      </div>
      <div className="pt-0.5">
        <p
          className={`text-sm font-semibold ${
            active || complete ? "text-slate-900" : "text-slate-400"
          }`}
        >
          {title}
        </p>
        <p
          className={`mt-1 max-w-md text-sm leading-5 ${
            active ? "text-slate-600" : "text-slate-400"
          }`}
        >
          {description}
        </p>
      </div>
      {number !== "03" && (
        <div className="absolute left-[17px] top-9 h-[calc(100%-18px)] w-px bg-slate-200" />
      )}
    </div>
  );
}

function SuspendedStatus() {
  return (
    <section className="overflow-hidden rounded-3xl border border-rose-200 bg-white shadow-sm">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative overflow-hidden bg-rose-50 p-7 sm:p-9">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full border-[20px] border-rose-200/60" />
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
              Account status
            </p>
            <h2 className="mt-3 max-w-sm text-3xl font-bold tracking-tight text-slate-950">
              Your affiliate access is paused.
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
              Your affiliate account is currently suspended, so referral links
              and earnings activity are temporarily unavailable.
            </p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 shadow-sm ring-1 ring-rose-200">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Suspended
            </div>
          </div>
        </div>

        <div className="p-7 sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            What you can do
          </p>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
            Need help with your account?
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Our support team can explain the status and help you understand the
            next step.
          </p>

          <div className="mt-8 space-y-5">
            <SuspendedStep
              number="01"
              title="Review your recent activity"
              description="Check that your shared promotions and referral traffic follow the program guidelines."
            />
            <SuspendedStep
              number="02"
              title="Contact support"
              description="Reach out if you believe the suspension was made in error or need clarification."
              active
            />
            <SuspendedStep
              number="03"
              title="Wait for account review"
              description="Your affiliate tools will become available again if access is restored."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function SuspendedStep({
  number,
  title,
  description,
  active,
}: {
  number: string;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          active ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-400"
        }`}
      >
        {number}
      </span>
      <div>
        <p
          className={`text-sm font-semibold ${active ? "text-slate-900" : "text-slate-700"}`}
        >
          {title}
        </p>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
    </div>
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
  const { query, setQuery, results, loading, loadMore, hasMore, totalCount } =
    useSearch({
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
    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 bg-white pb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base text-slate-900">
              Create a link to share
            </CardTitle>
            <CardDescription className="mt-1 max-w-xl text-slate-600">
              Pick any product below. We&apos;ll create a personal link that
              tracks clicks and sales for you.
            </CardDescription>
          </div>
        </div>
        <div className="mt-5 grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white font-semibold text-indigo-700 ring-1 ring-indigo-200">
              1
            </span>
            Choose a product
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white font-semibold text-indigo-700 ring-1 ring-indigo-200">
              2
            </span>
            Create your link
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white font-semibold text-indigo-700 ring-1 ring-indigo-200">
              3
            </span>
            Share and earn
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-11 pl-9"
            placeholder="Search by product name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {loading && (
          <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching products...
          </div>
        )}
        {!loading && query && results?.items.length === 0 && (
          <p className="py-5 text-center text-sm text-slate-500">
            No products found. Try a different search.
          </p>
        )}
        {results && results.items.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {results.items.map((item) => {
                const isLinked = existingProductIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                      isLinked
                        ? "border-slate-200 bg-slate-50"
                        : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                    }`}
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-contain"
                        />
                      ) : (
                        <Package className="absolute inset-0 m-auto h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        ₹{item.price.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isLinked ? "outline" : "default"}
                      disabled={isLinked || creatingId === item.id}
                      onClick={() => createLink(item.id)}
                    >
                      {isLinked ? (
                        <>
                          <Check className="mr-1.5 h-3.5 w-3.5" /> Linked
                        </>
                      ) : creatingId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Wallet className="mr-1.5 h-3.5 w-3.5" /> Create
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500 sm:flex-row">
              <span>
                Showing {results.items.length} of {totalCount} products
              </span>
              {hasMore ? (
                <Button variant="outline" onClick={loadMore} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Load more products
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <span className="text-xs text-slate-400">
                  Showing all available products
                </span>
              )}
            </div>
          </>
        )}
        {!query && !loading && (!results || results.items.length === 0) && (
          <div className="rounded-xl border border-dashed border-slate-200 px-5 py-7 text-center">
            <Search className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">
              Start by searching for a product
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Search results will appear here as you type.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
