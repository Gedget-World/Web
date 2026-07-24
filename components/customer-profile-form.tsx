"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Phone,
  Calendar,
  Settings,
  Shield,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomerStore } from "@/hooks/use-customer";

type Customer = {
  id?: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  preferences: Record<string, any>;
  marketing_consent: boolean;
  phone_verified: boolean;
  created_at?: string;
  updated_at?: string;
};

interface CustomerProfileFormProps {
  user: {
    id: string;
  };
  initialCustomer?: Customer | null;
}

export function CustomerProfileForm({
  user,
  initialCustomer,
}: CustomerProfileFormProps) {
  const { toast } = useToast();
  const updateCustomer = useCustomerStore((state) => state.updateCustomer);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!initialCustomer);
  const [customer, setCustomer] = useState<Customer>({
    user_id: user.id,
    first_name: initialCustomer?.first_name || "",
    last_name: initialCustomer?.last_name || "",
    phone: initialCustomer?.phone || "",
    date_of_birth: initialCustomer?.date_of_birth || "",
    preferences: initialCustomer?.preferences || {},
    marketing_consent: initialCustomer?.marketing_consent || false,
    phone_verified: initialCustomer?.phone_verified || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = initialCustomer
        ? `/api/customers/${initialCustomer.id}`
        : "/api/customers";
      const method = initialCustomer ? "PUT" : "POST";

      // Phone number is tied to the verified login and can't be edited here.
      const { phone, phone_verified, ...editableFields } = customer;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editableFields),
      });

      if (!response.ok) {
        throw new Error("Failed to save customer profile");
      }

      const savedCustomer = await response.json();

      // Update the cache with new customer data
      updateCustomer({
        ...savedCustomer,
        user_id: user.id,
      });

      toast({
        title: "Profile saved",
        description: "Your profile has been updated successfully.",
      });

      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isProfileComplete =
    customer.first_name && customer.last_name && customer.phone;

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {initialCustomer ? "Edit Profile" : "Complete Your Profile"}
          </CardTitle>
          <CardDescription>
            {initialCustomer
              ? "Update your personal information"
              : "Please complete your profile to enhance your shopping experience"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={customer.first_name || ""}
                  onChange={(e) =>
                    setCustomer((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={customer.last_name || ""}
                  onChange={(e) =>
                    setCustomer((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={customer.phone || ""}
                disabled
                readOnly
                placeholder="Not set"
              />
              <p className="text-xs text-slate-500">
                Your phone number is linked to your login and verified via OTP,
                so it can't be changed here.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={customer.date_of_birth || ""}
                onChange={(e) =>
                  setCustomer((prev) => ({
                    ...prev,
                    date_of_birth: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="marketing_consent"
                checked={customer.marketing_consent}
                onCheckedChange={(checked) =>
                  setCustomer((prev) => ({
                    ...prev,
                    marketing_consent: !!checked,
                  }))
                }
              />
              <Label htmlFor="marketing_consent" className="text-sm">
                I agree to receive marketing emails and promotional offers
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Profile"}
              </Button>
              {initialCustomer && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Profile
              {!isProfileComplete && (
                <Badge variant="destructive" className="ml-2">
                  Incomplete
                </Badge>
              )}
              {isProfileComplete && (
                <Badge variant="default" className="ml-2 bg-green-600">
                  Complete
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </div>
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Edit Profile
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <User className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Full Name</p>
              <p className="text-sm text-slate-900">
                {customer.first_name || customer.last_name
                  ? `${customer.first_name || ""} ${
                      customer.last_name || ""
                    }`.trim()
                  : "Not provided"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <Phone className="h-5 w-5 text-slate-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500">Phone Number</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-900">
                  {customer.phone || "Not provided"}
                </p>
                {customer.phone && (
                  <div className="flex items-center gap-1">
                    {customer.phone_verified ? (
                      <Badge variant="default" className="bg-green-600 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not Verified
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <Calendar className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Date of Birth</p>
            <p className="text-sm text-slate-900">
              {customer.date_of_birth
                ? new Date(customer.date_of_birth).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Not provided"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <Settings className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">
              Marketing Preferences
            </p>
            <p className="text-sm text-slate-900">
              {customer.marketing_consent
                ? "Subscribed to marketing emails"
                : "Not subscribed"}
            </p>
          </div>
        </div>

        {!isProfileComplete && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-sm font-medium text-amber-800">
                Please complete your profile
              </p>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Complete your profile to enhance your shopping experience and
              ensure smooth order processing.
            </p>
            <Button
              onClick={() => setIsEditing(true)}
              size="sm"
              className="mt-3"
            >
              Complete Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
