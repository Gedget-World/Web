"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useCustomer } from "@/hooks/use-customer";

interface ContactFormProps {
  user: {
    id: string;
  };
}

export interface ContactFormHandle {
  /**
   * Validate and persist the current contact info.
   * Returns true on success, false on validation/save failure.
   */
  save: () => Promise<boolean>;
}

const ContactForm = forwardRef<ContactFormHandle, ContactFormProps>(
  function ContactForm({ user }, ref) {
    const {
      customer,
      isHydrated,
      fetchCustomerData,
      saveCustomer,
      isCacheValid,
    } = useCustomer(user.id);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tempData, setTempData] = useState({
      first_name: "",
      last_name: "",
      phone: "",
    });
    const [hasUserEdited, setHasUserEdited] = useState(false);

    // Fetch customer data on mount (uses cache if valid)
    useEffect(() => {
      if (!isHydrated) return;

      const loadCustomer = async () => {
        setIsLoading(true);

        // Use cache if valid
        if (isCacheValid() && customer?.user_id === user.id) {
          setTempData({
            first_name: customer.first_name || "",
            last_name: customer.last_name || "",
            phone: customer.phone || "",
          });
          setIsLoading(false);
          return;
        }

        // Fetch from API
        const { customer: fetchedCustomer } = await fetchCustomerData();
        if (fetchedCustomer) {
          setTempData({
            first_name: fetchedCustomer.first_name || "",
            last_name: fetchedCustomer.last_name || "",
            phone: fetchedCustomer.phone || "",
          });
        }
        setIsLoading(false);
      };

      loadCustomer();
    }, [isHydrated, user.id]);

    // Seed from cached customer if the user hasn't edited yet
    useEffect(() => {
      if (customer && !hasUserEdited) {
        setTempData({
          first_name: customer.first_name || "",
          last_name: customer.last_name || "",
          phone: customer.phone || "",
        });
      }
    }, [customer, hasUserEdited]);

    const updateField = (field: keyof typeof tempData, value: string) => {
      setHasUserEdited(true);
      setTempData((prev) => ({ ...prev, [field]: value }));
    };

    const handlePhoneVerification = () => {
      alert("Phone verification feature coming soon!");
    };

    useImperativeHandle(
      ref,
      () => ({
        save: async () => {
          setError(null);

          const first = tempData.first_name.trim();
          const last = tempData.last_name.trim();
          const phone = tempData.phone.trim();

          if (!first || !last || !phone) {
            setError(
              "Please fill in your first name, last name, and phone number.",
            );
            return false;
          }

          // Skip API call if nothing changed vs. the cached customer.
          if (
            customer &&
            customer.first_name === first &&
            customer.last_name === last &&
            customer.phone === phone
          ) {
            return true;
          }

          setIsSaving(true);
          const result = await saveCustomer({
            first_name: first,
            last_name: last,
            phone,
          });
          setIsSaving(false);

          if (!result) {
            setError("Failed to save contact info. Please try again.");
            return false;
          }
          return true;
        },
      }),
      [tempData, customer, saveCustomer],
    );

    if (!isHydrated || isLoading) {
      return (
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="grid gap-1.5 sm:gap-2">
              <Label className="text-sm">Loading...</Label>
              <div className="h-9 sm:h-10 bg-slate-100 animate-pulse rounded"></div>
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label className="text-sm">Loading...</Label>
              <div className="h-9 sm:h-10 bg-slate-100 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 sm:space-y-4">
        <Label className="text-sm font-medium">Shipping Name</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="first_name" className="text-sm">
              First Name *
            </Label>
            <Input
              id="first_name"
              value={tempData.first_name}
              onChange={(e) => updateField("first_name", e.target.value)}
              placeholder="Enter first name"
              required
              disabled={isSaving}
              className="text-sm"
            />
          </div>
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="last_name" className="text-sm">
              Last Name *
            </Label>
            <Input
              id="last_name"
              value={tempData.last_name}
              onChange={(e) => updateField("last_name", e.target.value)}
              placeholder="Enter last name"
              required
              disabled={isSaving}
              className="text-sm"
            />
          </div>
        </div>

        <div className="grid gap-1.5 sm:gap-2">
          <Label htmlFor="phone" className="text-sm">
            Phone Number *
          </Label>
          <div className="flex gap-2">
            <Input
              id="phone"
              type="tel"
              value={tempData.phone}
              placeholder="Enter phone number"
              required
              disabled
              className="text-sm flex-1 disabled:opacity-100 disabled:cursor-not-allowed bg-slate-50 text-slate-600"
            />
            {customer?.phone && (
              <div className="flex items-center shrink-0">
                {customer.phone_verified ? (
                  <Badge className="gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[10px] font-medium text-green-700 shadow-none sm:text-xs">
                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Verified
                  </Badge>
                ) : (
                  <Badge
                    onClick={handlePhoneVerification}
                    className="cursor-pointer gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700 shadow-none transition-colors hover:bg-amber-100 sm:text-xs"
                  >
                    <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Verify
                  </Badge>
                )}
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Your phone number is verified via OTP and can't be edited here.
          </p>
        </div>

        {error && (
          <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 shrink-0" />
              <p className="text-xs sm:text-sm text-red-800 font-medium">
                {error}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  },
);

export default ContactForm;
