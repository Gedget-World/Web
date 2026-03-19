"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Star, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

type Review = {
  id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  user_id: string;
};

type ProductReviewsProps = {
  productId: string;
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
  userEmail: string | null;
};

export function ProductReviews({
  productId,
  reviews,
  averageRating,
  reviewCount,
  userEmail,
}: ProductReviewsProps) {
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("Title");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editHoveredRating, setEditHoveredRating] = useState(0);
  const [editTitle, setEditTitle] = useState("");
  const [editComment, setEditComment] = useState("");
  const router = useRouter();
  const supabase = createBrowserClient();

  console.log("Reviews:", reviews);

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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userEmail) {
      router.push("/auth/login");
      return;
    }

    setIsSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      user_id: user.id,
      rating,
      title,
      comment,
    });

    if (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } else {
      setTitle("");
      setComment("");
      setRating(5);
      setIsWritingReview(false);
      router.refresh();
    }

    setIsSubmitting(false);
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
      router.refresh();
    }
  };

  return (
    <div className="mt-1 w-full mx-auto px-4 sm:px-6 py-6 lg:px-8 bg-slate-50 border border-slate-200 rounded-lg">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
              Customer Reviews
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 sm:h-4 sm:w-4 ${
                      star <= Math.round(averageRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-blue-700">
                {averageRating > 0
                  ? averageRating.toFixed(1)
                  : "No ratings yet"}
              </span>
              <span className="text-blue-600 text-sm">
                {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </span>
            </div>
          </div>
          {!isWritingReview && (
            <Button
              onClick={() => setIsWritingReview(true)}
              size={"sm"}
              className="w-full sm:w-auto bg-orange-400 hover:bg-orange-500 text-white cursor-pointer"
            >
              <Pencil className="mr-1" size={12} /> Write a Review
            </Button>
          )}
        </div>

        {isWritingReview && (
          <div className="bg-white px-6 py-5 border mb-5 border-slate-200 rounded-lg">
            <h3 className="text-md sm:text-lg font-semibold text-slate-900">
              Share Your Experience
            </h3>
            <form
              onSubmit={handleSubmitReview}
              className="space-y-1 sm:space-y-2"
            >
              <div className="mt-4">
                <Label className="text-[10px] sm:text-sm text-slate-900 mb-2 block">
                  Rating
                </Label>
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-5 w-5 sm:h-5 sm:w-5 cursor-pointer ${
                          star <= (hoveredRating || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-[10px] sm:text-sm text-slate-600">
                    {rating} out of 5 stars
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <Label
                  htmlFor="comment"
                  className="text-[10px] sm:text-sm text-slate-900"
                >
                  Your Review
                </Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this product"
                  required
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto cursor-pointer bg-orange-400 hover:bg-orange-500 text-white"
                  size={"sm"}
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsWritingReview(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto cursor-pointer"
                  size={"sm"}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {reviews.length === 0 ? (
            <p className="text-slate-600 text-center py-6 sm:py-8 text-sm sm:text-base">
              No reviews yet. Be the first to review this product!
            </p>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className="py-2 sm:py-3 shadow-none">
                <CardContent className="px-3 sm:px-4">
                  {editingReviewId === review.id ? (
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <Label className="text-[10px] sm:text-sm font-medium text-slate-900 mb-1 block">
                          Rating
                        </Label>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
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
                                className={`h-5 w-5 sm:h-6 sm:w-6 ${
                                  star <= (editHoveredRating || editRating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm sm:text-base text-slate-600">
                            {editRating} out of 5 stars
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="edit-comment"
                          className="text-[10px] sm:text-sm font-medium text-slate-900"
                        >
                          Your Review
                        </Label>
                        <Textarea
                          id="edit-comment"
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          placeholder="Share your thoughts about this product"
                          required
                          rows={4}
                          className="mt-2"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <Button
                          onClick={() => handleSubmitEdit(review.id)}
                          disabled={isSubmitting}
                          className="w-full sm:w-auto cursor-pointer bg-orange-400 hover:bg-orange-500 text-white"
                          size={"sm"}
                        >
                          {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingReviewId(null)}
                          disabled={isSubmitting}
                          className="w-full sm:w-auto cursor-pointer"
                          size={"sm"}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarFallback className="bg-slate-200 text-slate-700 text-xs sm:text-sm">
                          <b>{review.user_id.substring(0, 2).toUpperCase()}</b>
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                    star <= review.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs sm:text-sm text-slate-500">
                              {new Date(review.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          {currentUserId === review.user_id && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditReview(review)}
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 cursor-pointer"
                              >
                                <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="sr-only">Edit review</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteReviewId(review.id)}
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 cursor-pointer" />
                                <span className="sr-only">Delete review</span>
                              </Button>
                            </div>
                          )}
                        </div>
                        {/* <h4 className="font-semibold text-slate-900">
                          {review.title}
                        </h4> */}
                        <p className="text-slate-800 text-sm sm:text-base leading-relaxed mt-1">
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
      </div>

      <AlertDialog
        open={deleteReviewId !== null}
        onOpenChange={() => setDeleteReviewId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteReviewId && handleDeleteReview(deleteReviewId)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
