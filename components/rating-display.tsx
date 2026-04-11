"use client";

import { Star } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  reviewCount: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function RatingDisplay({
  rating,
  reviewCount,
  size = "md",
  showCount = true,
}: RatingDisplayProps) {
  const sizes = {
    sm: { star: "h-3 w-3", text: "text-xs", gap: "gap-0.5" },
    md: { star: "h-4 w-4", text: "text-sm", gap: "gap-1" },
    lg: { star: "h-5 w-5", text: "text-base", gap: "gap-1" },
  };

  const { star, text, gap } = sizes[size];

  // Generate stars with partial fill
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center ${gap}`}>
      <div className="flex items-center">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className={`${star} text-amber-400 fill-amber-400`}
          />
        ))}
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={`${star} text-gray-200 fill-gray-200`} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={`${star} text-amber-400 fill-amber-400`} />
            </div>
          </div>
        )}
        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={`${star} text-gray-200 fill-gray-200`}
          />
        ))}
      </div>
      <span className={`${text} font-medium text-slate-700`}>
        {rating.toFixed(1)}
      </span>
      {showCount && (
        <span className={`${text} text-slate-500`}>
          ({reviewCount.toLocaleString("en-IN")}{" "}
          {reviewCount === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}
