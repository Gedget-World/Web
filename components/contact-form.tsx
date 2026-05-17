"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, User, CheckCircle2, AlertCircle } from "lucide-react";
import { useCustomer } from "@/hooks/use-customer";

interface ContactFormProps {
  user: {
    id: string;
    email: string;
  };
}

export default function ContactForm({ user }: ContactFormProps) {
  const {
    customer,
    isHydrated,
    fetchCustomerData,
    saveCustomer,
    isCacheValid,
  } = useCustomer(user.id);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tempData, setTempData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

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

  // Sync tempData when customer changes (from cache)
  useEffect(() => {
    if (customer && !isEditing) {
      setTempData({
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        phone: customer.phone || "",
      });
    }
  }, [customer, isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveCustomer(tempData);

    if (result) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handlePhoneVerification = () => {
    alert("Phone verification feature coming soon!");
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="grid gap-1.5 sm:gap-2">
          <Label className="text-sm">Email</Label>
          <Input disabled value={user.email} className="text-sm" />
        </div>
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
      <div className="grid gap-1.5 sm:gap-2">
        <Label htmlFor="email" className="text-sm">
          Email
        </Label>
        <Input
          id="email"
          disabled
          type="email"
          value={user.email}
          className="text-sm"
        />
      </div>

      {isEditing ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="grid gap-1.5 sm:gap-2">
              <Label htmlFor="first_name" className="text-sm">
                First Name *
              </Label>
              <Input
                id="first_name"
                value={tempData.first_name}
                onChange={(e) =>
                  setTempData((prev) => ({
                    ...prev,
                    first_name: e.target.value,
                  }))
                }
                placeholder="Enter first name"
                required
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
                onChange={(e) =>
                  setTempData((prev) => ({
                    ...prev,
                    last_name: e.target.value,
                  }))
                }
                placeholder="Enter last name"
                required
                className="text-sm"
              />
            </div>
          </div>
          <div className="grid gap-1.5 sm:gap-2">
            <Label htmlFor="phone" className="text-sm">
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={tempData.phone}
              onChange={(e) =>
                setTempData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="Enter phone number"
              required
              className="text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              className="w-full sm:w-auto"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="grid gap-1.5 sm:gap-2">
              <Label className="flex items-center gap-2 text-sm">
                First Name
              </Label>
              <Input
                disabled
                value={customer?.first_name || "Not provided"}
                className="bg-slate-50 text-sm"
              />
            </div>
            <div className="grid gap-1.5 sm:gap-2">
              <Label className="text-sm">Last Name</Label>
              <Input
                disabled
                value={customer?.last_name || "Not provided"}
                className="bg-slate-50 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-1.5 sm:gap-2">
            <Label className="flex items-center gap-2 text-sm">
              Phone Number
            </Label>
            <div className="flex gap-2">
              <Input
                disabled
                value={customer?.phone || "Not provided"}
                className="bg-slate-50 flex-1 text-sm"
              />
              {customer?.phone && (
                <div className="flex items-center shrink-0">
                  {customer.phone_verified ? (
                    <Badge
                      variant="default"
                      className="bg-green-600 text-[10px] sm:text-xs"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-slate-50 text-[10px] sm:text-xs"
                      onClick={handlePhoneVerification}
                    >
                      <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                      Verify
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {!customer?.first_name || !customer?.last_name || !customer?.phone ? (
            <div className="p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 shrink-0" />
                <p className="text-xs sm:text-sm text-amber-800 font-medium">
                  Complete your contact information
                </p>
              </div>
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                className="mt-2 w-full sm:w-auto text-xs sm:text-sm"
              >
                Add Details
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Edit Contact Info
            </Button>
          )}
        </>
      )}
    </div>
  );
}
