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
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  MoreHorizontalIcon,
  Star,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldX,
  MessageSquare,
  RefreshCw,
  Filter,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_approved: boolean;
  products: {
    name: string;
    slug: string;
  } | null;
}

interface CustomerInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewingReview, setViewingReview] = useState<Review | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<CustomerInfo | null>(
    null,
  );
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");

  const limit = 10;
  const supabase = createClient();

  const fetchCount = useCallback(async () => {
    let query = supabase
      .from("reviews")
      .select("id", { count: "exact", head: true });

    if (ratingFilter !== "all") {
      query = query.eq("rating", parseInt(ratingFilter));
    }
    if (statusFilter !== "all") {
      query = query.eq("is_active", statusFilter === "active");
    }
    if (approvalFilter !== "all") {
      query = query.eq("is_approved", approvalFilter === "approved");
    }

    const { count } = await query;
    setTotalCount(count || 0);
  }, [supabase, ratingFilter, statusFilter, approvalFilter]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("reviews")
      .select(
        `
        *,
        products (
          name,
          slug
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (ratingFilter !== "all") {
      query = query.eq("rating", parseInt(ratingFilter));
    }
    if (statusFilter !== "all") {
      query = query.eq("is_active", statusFilter === "active");
    }
    if (approvalFilter !== "all") {
      query = query.eq("is_approved", approvalFilter === "approved");
    }

    query = query.range(page * limit, page * limit + limit - 1);

    const { data, error } = await query;

    if (!error && data) {
      setReviews(data);
    }
    setLoading(false);
  }, [supabase, page, ratingFilter, statusFilter, approvalFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshCooldown(5);
    await Promise.all([fetchReviews(), fetchCount()]);
    setIsRefreshing(false);
  };

  const clearFilters = () => {
    setRatingFilter("all");
    setStatusFilter("all");
    setApprovalFilter("all");
    setPage(0);
  };

  const hasActiveFilters =
    ratingFilter !== "all" ||
    statusFilter !== "all" ||
    approvalFilter !== "all";

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
    fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const toggleReviewStatus = async (
    reviewId: string,
    currentStatus: boolean,
  ) => {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reviewId, is_active: !currentStatus }),
    });

    if (res.ok) {
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? { ...review, is_active: !currentStatus }
            : review,
        ),
      );
    }
  };

  const toggleApprovalStatus = async (
    reviewId: string,
    currentStatus: boolean,
  ) => {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reviewId, is_approved: !currentStatus }),
    });

    if (res.ok) {
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? { ...review, is_approved: !currentStatus }
            : review,
        ),
      );
    }
  };

  const handleViewReview = async (review: Review) => {
    setViewingReview(review);
    setViewingCustomer(null);

    // Fetch customer info (customers RLS is owner-only, so this must go
    // through the service-role-backed admin API, not the browser client)
    const res = await fetch(
      `/api/admin/customers?userId=${encodeURIComponent(review.user_id)}`,
    );
    if (res.ok) {
      const { customer } = await res.json();
      if (customer) {
        setViewingCustomer(customer);
      }
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-gray-600">Manage product reviews</p>
      </div>

      <div className="space-y-4 border border-gray-300 p-4 rounded-lg">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <Select
            value={ratingFilter}
            onValueChange={(value) => {
              setRatingFilter(value);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={approvalFilter}
            onValueChange={(value) => {
              setApprovalFilter(value);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Approval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}

          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshCooldown > 0 || isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {refreshCooldown > 0
                ? `Refresh (${refreshCooldown}s)`
                : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {hasActiveFilters ? "Filtered" : "Total"} Reviews:{" "}
            <span className="font-semibold">{totalCount}</span>
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approved</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              <>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        onClick={() =>
                          window.open(
                            `/products/${review.products?.slug}`,
                            "_blank",
                          )
                        }
                      >
                        {review.products?.name
                          ? review.products.name.length > 20
                            ? `${review.products.name.slice(0, 20)}...`
                            : review.products.name
                          : "-"}
                      </button>
                    </TableCell>
                    <TableCell>{renderStars(review.rating)}</TableCell>
                    <TableCell>
                      {review.is_active ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {review.is_approved ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <ShieldX className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(review.created_at)}</TableCell>
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
                              onClick={() => handleViewReview(review)}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              View Review
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                window.open(
                                  `/products/${review.products?.slug}`,
                                  "_blank",
                                )
                              }
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Product
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                toggleReviewStatus(review.id, review.is_active)
                              }
                            >
                              {review.is_active ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Hide Review
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Show Review
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                toggleApprovalStatus(
                                  review.id,
                                  review.is_approved,
                                )
                              }
                            >
                              {review.is_approved ? (
                                <>
                                  <ShieldX className="w-4 h-4 mr-2" />
                                  Unapprove
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-4 h-4 mr-2" />
                                  Approve
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {reviews.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No reviews found.
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {page + 1} of {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* View Review Dialog */}
      <Dialog
        open={viewingReview !== null}
        onOpenChange={() => {
          setViewingReview(null);
          setViewingCustomer(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {viewingReview && (
            <div className="space-y-4">
              {/* Product */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Product</p>
                <p className="font-medium">
                  {viewingReview.products?.name || "-"}
                </p>
              </div>

              {/* Customer */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Customer</p>
                {viewingCustomer ? (
                  <button
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                    onClick={() =>
                      window.open(
                        `/admin/dashboard/Customers/${viewingCustomer.id}`,
                        "_blank",
                      )
                    }
                  >
                    {`${viewingCustomer.first_name || ""} ${viewingCustomer.last_name || ""}`.trim() ||
                      "Unknown"}
                  </button>
                ) : (
                  <p className="text-sm text-gray-400">Loading...</p>
                )}
              </div>

              {/* Rating */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Rating</p>
                <div className="flex items-center gap-2">
                  {renderStars(viewingReview.rating)}
                  <span className="text-sm font-medium">
                    {viewingReview.rating}/5
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Comment</p>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">
                  {viewingReview.comment}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  {viewingReview.is_active ? (
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">Hidden</Badge>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Approval</p>
                  {viewingReview.is_approved ? (
                    <Badge className="bg-blue-100 text-blue-800">
                      Approved
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>

              {/* Date */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Submitted on</p>
                <p className="text-sm">
                  {formatDate(viewingReview.created_at)}
                </p>
              </div>

              {/* Approve Button */}
              {!viewingReview.is_approved && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    toggleApprovalStatus(
                      viewingReview.id,
                      viewingReview.is_approved,
                    );
                    setViewingReview({ ...viewingReview, is_approved: true });
                  }}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Approve Review
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
