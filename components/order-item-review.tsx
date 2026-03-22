"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type OrderItemReviewProps = {
  productId: string;
  productName: string;
  userId: string;
};

export function OrderItemReview({
  productId,
  productName,
  userId,
}: OrderItemReviewProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<{
    id: string;
    rating: number;
    comment: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkExistingReview = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment")
        .eq("product_id", productId)
        .eq("user_id", userId)
        .single();

      if (data) {
        setExistingReview(data);
        setRating(data.rating);
        setComment(data.comment);
      }
    };

    checkExistingReview();
  }, [supabase, productId, userId]);

  const handleSubmitReview = async () => {
    setIsSubmitting(true);

    if (existingReview && isEditing) {
      // Update existing review
      const { error } = await supabase
        .from("reviews")
        .update({
          rating,
          comment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReview.id);

      if (error) {
        console.error("Error updating review:", error);
        alert("Failed to update review. Please try again.");
      } else {
        setExistingReview({ ...existingReview, rating, comment });
        setIsEditing(false);
        router.refresh();
      }
    } else {
      // Create new review
      const { error, data } = await supabase
        .from("reviews")
        .insert({
          product_id: productId,
          user_id: userId,
          rating,
          title: "Review",
          comment,
        })
        .select("id, rating, comment")
        .single();

      if (error) {
        console.error("Error submitting review:", error);
        alert("Failed to submit review. Please try again.");
      } else {
        setExistingReview(data);
        router.refresh();
      }
    }

    setIsSubmitting(false);
  };

  if (existingReview && !isEditing) {
    return (
      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= existingReview.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-green-700 font-medium">
              You reviewed this product
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        </div>
        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
          {existingReview.comment}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <p className="text-xs font-medium text-slate-700 mb-2">
        {isEditing ? "Edit your review" : "Rate this product"}
      </p>
      <div className="flex items-center gap-1 mb-2">
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
              className={`h-5 w-5 cursor-pointer ${
                star <= (hoveredRating || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-xs text-slate-500">{rating} out of 5</span>
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={`Share your experience with ${productName}`}
        rows={2}
        className="text-sm mb-2"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSubmitReview}
          disabled={isSubmitting || !comment.trim()}
          className="h-7 text-xs bg-orange-400 hover:bg-orange-500 text-white"
        >
          {isSubmitting
            ? "Submitting..."
            : isEditing
              ? "Update Review"
              : "Submit Review"}
        </Button>
        {isEditing && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              setRating(existingReview?.rating || 5);
              setComment(existingReview?.comment || "");
            }}
            className="h-7 text-xs"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
