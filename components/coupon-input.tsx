"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from "@/lib/supabase/client";
import { Loader2, Tag, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";

type CouponInputProps = {
  subtotal: number;
};

export function CouponInput({ subtotal }: CouponInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const supabase = createBrowserClient();

  const handleApplyCoupon = async () => {
    if (!code.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: coupon, error: fetchError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (fetchError || !coupon) {
        setError("Invalid coupon code");
        setLoading(false);
        return;
      }

      // Check if coupon is expired
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        setError("This coupon has expired");
        setLoading(false);
        return;
      }

      // Check minimum purchase amount
      if (subtotal < coupon.min_purchase_amount) {
        setError(
          `Minimum purchase of $${coupon.min_purchase_amount.toFixed(
            2
          )} required`
        );
        setLoading(false);
        return;
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        setError("This coupon has reached its usage limit");
        setLoading(false);
        return;
      }

      applyCoupon({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount_amount: coupon.max_discount_amount,
        min_purchase_amount: coupon.min_purchase_amount,
      });

      setCode("");
      setError("");
    } catch (err) {
      setError("Failed to apply coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCode("");
    setError("");
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-900">
              {appliedCoupon.code}
            </p>
            <p className="text-xs text-green-700">
              {appliedCoupon.discount_type === "percentage"
                ? `${appliedCoupon.discount_value}% off`
                : `$${appliedCoupon.discount_value} off`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemoveCoupon}
          className="h-8 w-8 text-green-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Enter coupon code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
          className="flex-1"
        />
        <Button
          onClick={handleApplyCoupon}
          disabled={loading}
          variant="outline"
          className="cursor-pointer"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag />}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
