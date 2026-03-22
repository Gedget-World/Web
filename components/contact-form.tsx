"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, User, CheckCircle2, AlertCircle } from "lucide-react";

type Customer = {
  id?: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  phone_verified: boolean;
};

interface ContactFormProps {
  user: {
    id: string;
    email: string;
  };
}

export default function ContactForm({ user }: ContactFormProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tempData, setTempData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  useEffect(() => {
    fetchCustomer();
  }, [user.id]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setCustomer(data);
          setTempData({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            phone: data.phone || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const url = customer ? `/api/customers/${customer.id}` : "/api/customers";
      const method = customer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          ...tempData,
        }),
      });

      if (response.ok) {
        const updatedCustomer = await response.json();
        setCustomer(updatedCustomer);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  const handlePhoneVerification = () => {
    // Placeholder for phone verification
    alert("Phone verification feature coming soon!");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label>Email</Label>
          <Input disabled value={user.email} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Loading...</Label>
            <div className="h-9 bg-slate-100 animate-pulse rounded"></div>
          </div>
          <div className="grid gap-2">
            <Label>Loading...</Label>
            <div className="h-9 bg-slate-100 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" disabled type="email" value={user.email} />
      </div>

      {isEditing ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first_name">First Name *</Label>
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
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">Last Name *</Label>
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
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={tempData.phone}
              onChange={(e) =>
                setTempData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="Enter phone number"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              Save
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">First Name</Label>
              <Input
                disabled
                value={customer?.first_name || "Not provided"}
                className="bg-slate-50"
              />
            </div>
            <div className="grid gap-2">
              <Label>Last Name</Label>
              <Input
                disabled
                value={customer?.last_name || "Not provided"}
                className="bg-slate-50"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">Phone Number</Label>
            <div className="flex gap-2">
              <Input
                disabled
                value={customer?.phone || "Not provided"}
                className="bg-slate-50 flex-1"
              />
              {customer?.phone && (
                <div className="flex items-center">
                  {customer.phone_verified ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={handlePhoneVerification}
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Verify
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {!customer?.first_name || !customer?.last_name || !customer?.phone ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-800 font-medium">
                  Complete your contact information
                </p>
              </div>
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                className="mt-2"
              >
                Add Details
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
            >
              Edit Contact Info
            </Button>
          )}
        </>
      )}
    </div>
  );
}
