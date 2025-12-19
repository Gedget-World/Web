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
  const [title, setTitle] = useState("");
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
    <div className="mt-1 w-5xl mx-auto">
      <div className="pt-5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Customer Reviews
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
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
              <span className="text-sm font-semibold text-slate-900">
                {averageRating > 0
                  ? averageRating.toFixed(1)
                  : "No ratings yet"}
              </span>
              <span className="text-slate-600 text-sm">
                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>
          {!isWritingReview && (
            <Button onClick={() => setIsWritingReview(true)} size={"sm"}>
              Write a Review
            </Button>
          )}
        </div>

        {isWritingReview && (
          <Card className="mb-8">
            <CardHeader>
              <h3 className="text-xl font-semibold text-slate-900">
                Write Your Review
              </h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div>
                  <Label className="text-base font-medium text-slate-900 mb-2 block">
                    Rating
                  </Label>
                  <div className="flex items-center gap-2">
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
                          className={`h-8 w-8 ${
                            star <= (hoveredRating || rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-slate-600">
                      {rating} out of 5 stars
                    </span>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="title"
                    className="text-base font-medium text-slate-900"
                  >
                    Review Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Sum up your experience"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="comment"
                    className="text-base font-medium text-slate-900"
                  >
                    Your Review
                  </Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts about this product"
                    required
                    rows={5}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsWritingReview(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {reviews.length === 0 ? (
            <p className="text-slate-600 text-center py-8">
              No reviews yet. Be the first to review this product!
            </p>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className="py-3">
                <CardContent className="px-4">
                  {editingReviewId === review.id ? (
                    <div className="space-y-1">
                      <div>
                        <Label className="text-base font-medium text-slate-900 mb-1 block">
                          Rating
                        </Label>
                        <div className="flex items-center gap-2">
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
                          <span className="ml-2 text-slate-600">
                            {editRating} out of 5 stars
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label
                          htmlFor="edit-title"
                          className="text-base font-medium text-slate-900"
                        >
                          Review Title
                        </Label>
                        <Input
                          id="edit-title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Sum up your experience"
                          required
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label
                          htmlFor="edit-comment"
                          className="text-base font-medium text-slate-900"
                        >
                          Your Review
                        </Label>
                        <Textarea
                          id="edit-comment"
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          placeholder="Share your thoughts about this product"
                          required
                          rows={5}
                          className="mt-2"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleSubmitEdit(review.id)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingReviewId(null)}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-slate-200 text-slate-700">
                          {review.user_id.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= review.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-slate-600">
                              {new Date(review.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                          {currentUserId === review.user_id && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditReview(review)}
                                className="h-8 w-8 p-0 cursor-pointer"
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit review</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteReviewId(review.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 cursor-pointer" />
                                <span className="sr-only">Delete review</span>
                              </Button>
                            </div>
                          )}
                        </div>
                        {/* <h4 className="font-semibold text-slate-900">
                          {review.title}
                        </h4> */}
                        <p className="text-black text-md leading-relaxed">
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
