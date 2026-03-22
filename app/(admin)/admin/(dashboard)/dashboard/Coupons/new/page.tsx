"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { debounce } from "lodash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Check, X, Loader2 } from "lucide-react";
import Link from "next/link";

function NewCouponContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const couponId = searchParams.get("id");
  const isEditMode = !!couponId;

  const [coupon, setCoupon] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: null as number | null,
    min_purchase_amount: null as number | null,
    max_discount_amount: null as number | null,
    usage_limit: null as number | null,
    valid_from: "",
    valid_until: "",
    is_active: true,
  });

  const [codeStatus, setCodeStatus] = useState<
    "checking" | "available" | "taken" | ""
  >("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalCode, setOriginalCode] = useState("");

  // Fetch existing coupon data if editing
  useEffect(() => {
    if (couponId) {
      const fetchCoupon = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .eq("id", couponId)
          .single();

        if (data && !error) {
          setOriginalCode(data.code);
          setCoupon({
            code: data.code,
            description: data.description || "",
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            min_purchase_amount: data.min_purchase_amount,
            max_discount_amount: data.max_discount_amount,
            usage_limit: data.usage_limit,
            valid_from: data.valid_from
              ? new Date(data.valid_from).toISOString().slice(0, 16)
              : "",
            valid_until: data.valid_until
              ? new Date(data.valid_until).toISOString().slice(0, 16)
              : "",
            is_active: data.is_active,
          });
          setCodeStatus("available");
        }
        setLoading(false);
      };
      fetchCoupon();
    }
  }, [couponId, supabase]);

  // Validation errors
  const [errors, setErrors] = useState({
    code: false,
    discount_value: false,
    min_purchase_amount: false,
    max_discount_amount: false,
    date_range: false,
  });

  const handleChange = (key: string, value: any) => {
    setCoupon((prev) => ({ ...prev, [key]: value }));
  };

  // Check if coupon code is unique
  const checkCode = useCallback(
    debounce(async (value: string) => {
      if (!value) {
        setCodeStatus("");
        return;
      }
      // Skip check if editing and code hasn't changed
      if (isEditMode && value.toUpperCase() === originalCode.toUpperCase()) {
        setCodeStatus("available");
        return;
      }
      setCodeStatus("checking");

      const { data } = await supabase
        .from("coupons")
        .select("id")
        .eq("code", value.toUpperCase())
        .maybeSingle();

      setCodeStatus(data ? "taken" : "available");
    }, 500),
    [isEditMode, originalCode],
  );

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 50);
    handleChange("code", value);
    checkCode(value);
  };

  const validate = () => {
    const newErrors = {
      code: false,
      discount_value: false,
      min_purchase_amount: false,
      max_discount_amount: false,
      date_range: false,
    };
    let isValid = true;

    // Code validation (skip "taken" check if code unchanged in edit mode)
    const codeUnchanged =
      isEditMode && coupon.code.toUpperCase() === originalCode.toUpperCase();
    if (!coupon.code.trim() || (codeStatus === "taken" && !codeUnchanged)) {
      newErrors.code = true;
      isValid = false;
    }

    // Discount value validation
    if (!coupon.discount_value || coupon.discount_value <= 0) {
      newErrors.discount_value = true;
      isValid = false;
    }

    // Percentage validation (max 100%)
    if (
      coupon.discount_type === "percentage" &&
      coupon.discount_value &&
      coupon.discount_value > 100
    ) {
      newErrors.discount_value = true;
      isValid = false;
    }

    // Min purchase amount validation
    if (coupon.min_purchase_amount !== null && coupon.min_purchase_amount < 0) {
      newErrors.min_purchase_amount = true;
      isValid = false;
    }

    // Max discount amount validation
    if (coupon.max_discount_amount !== null && coupon.max_discount_amount < 0) {
      newErrors.max_discount_amount = true;
      isValid = false;
    }

    // Date range validation
    if (coupon.valid_from && coupon.valid_until) {
      const from = new Date(coupon.valid_from);
      const until = new Date(coupon.valid_until);
      if (until < from) {
        newErrors.date_range = true;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);

    const couponData = {
      code: coupon.code.toUpperCase(),
      description: coupon.description || null,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase_amount: coupon.min_purchase_amount || 0,
      max_discount_amount: coupon.max_discount_amount || null,
      usage_limit: coupon.usage_limit || null,
      valid_from: coupon.valid_from || null,
      valid_until: coupon.valid_until || null,
      is_active: coupon.is_active,
    };

    let error;

    if (isEditMode) {
      const result = await supabase
        .from("coupons")
        .update(couponData)
        .eq("id", couponId);
      error = result.error;
    } else {
      const result = await supabase.from("coupons").insert([couponData]);
      error = result.error;
    }

    if (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} coupon:`,
        error,
      );
      alert(
        `Error ${isEditMode ? "updating" : "creating"} coupon. Please try again.`,
      );
      setSubmitting(false);
      return;
    }

    router.push("/admin/dashboard/Coupons");
  };

  return (
    <div className="mx-4 my-2">
      <header className="p-2 flex items-center gap-4 mb-4">
        <Link href="/admin/dashboard/Coupons">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit Coupon" : "Create New Coupon"}
        </h1>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Set the coupon code and discount details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Coupon Code */}
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Coupon Code <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="code"
                      value={coupon.code}
                      onChange={handleCodeChange}
                      placeholder="e.g., SAVE20"
                      className={`uppercase ${errors.code ? "border-red-500" : ""}`}
                    />
                    {codeStatus && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {codeStatus === "checking" && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                        {codeStatus === "available" && (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                        {codeStatus === "taken" && (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {errors.code && (
                    <p className="text-red-500 text-xs font-semibold">
                      {codeStatus === "taken"
                        ? "This coupon code already exists."
                        : "Coupon code is required."}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={coupon.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="e.g., Get 20% off on your first order"
                    rows={3}
                  />
                </div>

                {/* Discount Type */}
                <div className="space-y-2">
                  <Label htmlFor="discount_type">
                    Discount Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={coupon.discount_type}
                    onValueChange={(value) =>
                      handleChange("discount_type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Discount Value */}
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    Discount Value <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="discount_value"
                      type="number"
                      value={coupon.discount_value ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "discount_value",
                          e.target.value ? parseFloat(e.target.value) : null,
                        )
                      }
                      placeholder={
                        coupon.discount_type === "percentage"
                          ? "e.g., 20"
                          : "e.g., 100"
                      }
                      className={errors.discount_value ? "border-red-500" : ""}
                      min={0}
                      max={
                        coupon.discount_type === "percentage" ? 100 : undefined
                      }
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {coupon.discount_type === "percentage" ? "%" : "₹"}
                    </span>
                  </div>
                  {errors.discount_value && (
                    <p className="text-red-500 text-xs font-semibold">
                      {coupon.discount_type === "percentage" &&
                      coupon.discount_value &&
                      coupon.discount_value > 100
                        ? "Percentage cannot exceed 100%."
                        : "Please enter a valid discount value."}
                    </p>
                  )}
                </div>

                {/* Max Discount Amount (only for percentage) */}
                {coupon.discount_type === "percentage" && (
                  <div className="space-y-2">
                    <Label htmlFor="max_discount_amount">
                      Maximum Discount Amount
                    </Label>
                    <div className="relative">
                      <Input
                        id="max_discount_amount"
                        type="number"
                        value={coupon.max_discount_amount ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "max_discount_amount",
                            e.target.value ? parseFloat(e.target.value) : null,
                          )
                        }
                        placeholder="e.g., 500"
                        className={
                          errors.max_discount_amount ? "border-red-500" : ""
                        }
                        min={0}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        ₹
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Cap the maximum discount amount for percentage-based
                      coupons.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Restrictions & Validity */}
            <Card>
              <CardHeader>
                <CardTitle>Restrictions & Validity</CardTitle>
                <CardDescription>
                  Set usage limits and validity period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Minimum Purchase Amount */}
                <div className="space-y-2">
                  <Label htmlFor="min_purchase_amount">
                    Minimum Purchase Amount
                  </Label>
                  <div className="relative">
                    <Input
                      id="min_purchase_amount"
                      type="number"
                      value={coupon.min_purchase_amount ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "min_purchase_amount",
                          e.target.value ? parseFloat(e.target.value) : null,
                        )
                      }
                      placeholder="e.g., 500"
                      className={
                        errors.min_purchase_amount ? "border-red-500" : ""
                      }
                      min={0}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      ₹
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Minimum cart value required to apply this coupon.
                  </p>
                </div>

                {/* Usage Limit */}
                <div className="space-y-2">
                  <Label htmlFor="usage_limit">Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={coupon.usage_limit ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "usage_limit",
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    placeholder="e.g., 100"
                    min={1}
                  />
                  <p className="text-xs text-gray-500">
                    Total number of times this coupon can be used. Leave empty
                    for unlimited.
                  </p>
                </div>

                {/* Valid From */}
                <div className="space-y-2">
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="datetime-local"
                    value={coupon.valid_from}
                    onChange={(e) => handleChange("valid_from", e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty to make it valid immediately.
                  </p>
                </div>

                {/* Valid Until */}
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="datetime-local"
                    value={coupon.valid_until}
                    onChange={(e) =>
                      handleChange("valid_until", e.target.value)
                    }
                    className={errors.date_range ? "border-red-500" : ""}
                  />
                  {errors.date_range && (
                    <p className="text-red-500 text-xs font-semibold">
                      End date must be after start date.
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Leave empty for no expiration.
                  </p>
                </div>

                {/* Is Active */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="is_active">Active Status</Label>
                    <p className="text-xs text-gray-500">
                      Enable or disable this coupon immediately.
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={coupon.is_active}
                    onCheckedChange={(checked) =>
                      handleChange("is_active", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 mt-6">
            <Link href="/admin/dashboard/Coupons">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={submitting || loading}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Update Coupon"
              ) : (
                "Create Coupon"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function NewCouponPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <NewCouponContent />
    </Suspense>
  );
}
