"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Star,
  Pencil,
  Trash2,
  BadgeCheck,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

type Review = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  user_id: string;
  is_active: boolean;
  is_approved: boolean;
};

type LazyProductReviewsProps = {
  productId: string;
  userEmail: string | null;
  averageRating: number;
  reviewCount: number;
};

const REVIEWS_PER_PAGE = 5;

export function LazyProductReviews({
  productId,
  userEmail,
  averageRating,
  reviewCount,
}: LazyProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalReviewCount, setTotalReviewCount] = useState(reviewCount);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editHoveredRating, setEditHoveredRating] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editComment, setEditComment] = useState("");
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    setTotalReviewCount(reviewCount);
  }, [reviewCount]);

  // Fetch the first page of active reviews on mount.
  useEffect(() => {
    let isMounted = true;

    const fetchReviews = async () => {
      setIsLoading(true);
      setLoadError(null);
      setReviews([]);

      const { data, count, error } = await supabase
        .from("reviews")
        .select("*", { count: "exact" })
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(0, REVIEWS_PER_PAGE - 1);

      if (!isMounted) return;

      if (error) {
        console.error("Error loading product reviews:", error);
        setLoadError("Could not load reviews. Please try again.");
      } else {
        setReviews(data || []);
        setTotalReviewCount(count || 0);
      }
      setIsLoading(false);
    };

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, [productId, supabase]);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, [supabase]);

  const hasMoreReviews = reviews.length < totalReviewCount;

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setLoadError(null);

    const { data, count, error } = await supabase
      .from("reviews")
      .select("*", { count: "exact" })
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(reviews.length, reviews.length + REVIEWS_PER_PAGE - 1);

    if (error) {
      console.error("Error loading more product reviews:", error);
      setLoadError("Could not load more reviews. Please try again.");
    } else {
      setReviews((currentReviews) => {
        const existingIds = new Set(currentReviews.map((review) => review.id));
        return [
          ...currentReviews,
          ...(data || []).filter((review) => !existingIds.has(review.id)),
        ];
      });
      setTotalReviewCount(count || 0);
    }

    setIsLoadingMore(false);
  };

  const handleEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditTitle(review.title);
    setEditComment(review.comment);
  };

  const handleSubmitEdit = async (reviewId: string) => {
    setIsSubmitting(true);

    const { error } = await supabase
      .from("reviews")
      .update({
        rating: editRating,
        title: editTitle,
        comment: editComment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (error) {
      console.error("Error updating review:", error);
      alert("Failed to update review. Please try again.");
    } else {
      setEditingReviewId(null);
      setReviews((currentReviews) =>
        currentReviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                rating: editRating,
                title: editTitle,
                comment: editComment,
              }
            : review,
        ),
      );
      router.refresh();
    }

    setIsSubmitting(false);
  };

  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review. Please try again.");
    } else {
      setDeleteReviewId(null);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setTotalReviewCount((currentCount) => Math.max(0, currentCount - 1));
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="w-full mx-auto px-4 sm:px-6 py-6 lg:px-8 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="mb-6">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="py-2 shadow-none">
              <CardContent className="px-3 sm:px-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 sm:px-6 py-6 lg:px-8 bg-slate-50 border border-slate-200 rounded-lg">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              Customer Reviews
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.round(averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-blue-700">
                {averageRating > 0
                  ? averageRating.toFixed(1)
                  : "No ratings yet"}
              </span>
              <span className="text-blue-600 text-xs">
                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {loadError && (
            <p role="alert" className="text-center py-3 text-sm text-red-600">
              {loadError}
            </p>
          )}
          {!loadError && reviews.length === 0 ? (
            <p className="text-slate-600 text-center py-6 text-sm">
              No reviews yet. Be the first to review this product!
            </p>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className="py-2 shadow-none">
                <CardContent className="px-3 sm:px-4">
                  {editingReviewId === review.id ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-slate-900 mb-1 block">
                          Rating
                        </Label>
                        <div className="flex items-center gap-1 flex-wrap">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setEditRating(star)}
                              onMouseEnter={() => setEditHoveredRating(star)}
                              onMouseLeave={() => setEditHoveredRating(0)}
                              className="transition-transform hover:scale-110"
                            >
                              <Star
                                className={`h-5 w-5 ${
                                  star <= (editHoveredRating || editRating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-xs text-slate-600">
                            {editRating} out of 5
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="edit-comment"
                          className="text-xs font-medium text-slate-900"
                        >
                          Your Review
                        </Label>
                        <Textarea
                          id="edit-comment"
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          placeholder="Share your thoughts about this product"
                          required
                          rows={3}
                          className="mt-1 text-sm"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSubmitEdit(review.id)}
                          disabled={isSubmitting}
                          className="cursor-pointer bg-orange-400 hover:bg-orange-500 text-white text-xs h-7"
                          size="sm"
                        >
                          {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingReviewId(null)}
                          disabled={isSubmitting}
                          className="cursor-pointer text-xs h-7"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-slate-200 text-slate-700 text-[10px]">
                          <b>{review.user_id.substring(0, 2).toUpperCase()}</b>
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 ${
                                    star <= review.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {new Date(review.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                            {review.is_approved && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-medium">
                                <BadgeCheck className="h-3 w-3" />
                                Verified
                              </span>
                            )}
                          </div>
                          {currentUserId === review.user_id && (
                            <div className="flex gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditReview(review)}
                                className="h-6 w-6 p-0 cursor-pointer"
                              >
                                <Pencil className="h-3 w-3" />
                                <span className="sr-only">Edit review</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteReviewId(review.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span className="sr-only">Delete review</span>
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-slate-800 text-xs leading-relaxed mt-1">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Load More Button */}
        {hasMoreReviews && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              {isLoadingMore ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <ChevronDown className="h-3 w-3 mr-1" />
              )}
              {isLoadingMore ? "Loading..." : "Load More Reviews"} (
              {Math.max(0, totalReviewCount - reviews.length)}{" "}
              remaining)
            </Button>
          </div>
        )}
      </div>

      <AlertDialog
        open={deleteReviewId !== null}
        onOpenChange={() => setDeleteReviewId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">
              Delete Review
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete this review? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteReviewId && handleDeleteReview(deleteReviewId)
              }
              className="bg-red-600 hover:bg-red-700 text-sm"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
