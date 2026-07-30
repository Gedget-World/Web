"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  Mail,
  CheckCircle,
  XCircle,
  ShoppingBag,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";

interface Customer {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  preferences: Record<string, unknown> | null;
  marketing_consent: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  phone_verified: boolean;
}

interface Address {
  id: string;
  type: string;
  is_default: boolean;
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  customer_email: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.customerId as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const res = await fetch(`/api/admin/customers?id=${customerId}`);
        const json = await res.json();

        if (res.ok) {
          setCustomer(json.customer);
          setAddresses(json.addresses || []);
          setOrders(json.orders || []);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getFullName = () => {
    if (!customer) return "-";
    const firstName = customer.first_name || "";
    const lastName = customer.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Customer not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/dashboard/Customers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Customer Details</h1>
            <p className="text-sm text-muted-foreground">
              Customer ID: {customer.id}
            </p>
          </div>
        </div>
        {customer.phone_verified ? (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Phone Verified
          </Badge>
        ) : (
          <Badge className="bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3 mr-1" />
            Phone Not Verified
          </Badge>
        )}
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{getFullName()}</span>
                {getFullName() !== "-" && (
                  <button
                    onClick={() => copyToClipboard(getFullName(), "name")}
                    className="p-1 hover:bg-gray-100 rounded transition-all"
                    title="Copy name"
                  >
                    {copied === "name" ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Phone</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{customer.phone || "-"}</span>
                {customer.phone && (
                  <button
                    onClick={() => copyToClipboard(customer.phone!, "phone")}
                    className="p-1 hover:bg-gray-100 rounded transition-all"
                    title="Copy phone"
                  >
                    {copied === "phone" ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Date of Birth
              </span>
              <span className="font-medium">
                {formatDate(customer.date_of_birth)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Joined</span>
              <span className="font-medium">
                {formatDate(customer.created_at)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Last Updated
              </span>
              <span className="font-medium">
                {formatDate(customer.updated_at)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Marketing Consent
              </span>
              {customer.marketing_consent ? (
                <Badge className="bg-blue-100 text-blue-800">Yes</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-600">No</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Orders
              </span>
              <span className="font-medium">{orders.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customer.preferences &&
            Object.keys(customer.preferences).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(customer.preferences).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium text-sm">
                      {typeof value === "boolean"
                        ? value
                          ? "Yes"
                          : "No"
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No preferences set
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" /> Saved Addresses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {addresses.length > 0 ? (
            <div className="divide-y border rounded-lg">
              {addresses.map((address) => (
                <button
                  key={address.id}
                  onClick={() => setSelectedAddress(address)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {address.full_name}
                      </span>
                      {address.is_default && (
                        <Badge variant="outline">Default</Badge>
                      )}
                      <Badge
                        className={
                          address.type === "shipping"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }
                      >
                        {address.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {address.address_line1}
                      {address.address_line2 &&
                        `, ${address.address_line2}`}, {address.city},{" "}
                      {address.state} {address.postal_code}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No addresses saved</p>
          )}
        </CardContent>
      </Card>

      {/* Address Details Dialog */}
      <Dialog
        open={!!selectedAddress}
        onOpenChange={(open) => !open && setSelectedAddress(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Address Details</DialogTitle>
          </DialogHeader>
          {selectedAddress && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {selectedAddress.is_default && (
                  <Badge variant="outline">Default</Badge>
                )}
                <Badge
                  className={
                    selectedAddress.type === "shipping"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }
                >
                  {selectedAddress.type}
                </Badge>
              </div>

              <div className="space-y-1.5">
                {[
                  { label: "Full Name", value: selectedAddress.full_name },
                  {
                    label: "Address Line 1",
                    value: selectedAddress.address_line1,
                  },
                  {
                    label: "Address Line 2",
                    value: selectedAddress.address_line2,
                  },
                  { label: "City", value: selectedAddress.city },
                  { label: "State", value: selectedAddress.state },
                  {
                    label: "Postal Code",
                    value: selectedAddress.postal_code,
                  },
                  { label: "Country", value: selectedAddress.country },
                ]
                  .filter((field) => field.value)
                  .map((field) => {
                    const fieldKey = `address-${selectedAddress.id}-${field.label}`;
                    return (
                      <div
                        key={field.label}
                        className="flex items-center justify-between gap-2 border-b pb-1.5 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <span className="text-xs text-muted-foreground">
                            {field.label}
                          </span>
                          <p className="text-sm truncate">{field.value}</p>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(field.value as string, fieldKey)
                          }
                          className="p-1 hover:bg-gray-100 rounded transition-all shrink-0"
                          title={`Copy ${field.label}`}
                        >
                          {copied === fieldKey ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
                          )}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const fullAddress = [
                    selectedAddress.full_name,
                    selectedAddress.address_line1,
                    selectedAddress.address_line2,
                    selectedAddress.city,
                    selectedAddress.state,
                    selectedAddress.postal_code,
                    selectedAddress.country,
                  ]
                    .filter(Boolean)
                    .join(", ");
                  copyToClipboard(fullAddress, `address-${selectedAddress.id}`);
                }}
              >
                {copied === `address-${selectedAddress.id}` ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy Full Address
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <Badge
                        className={statusColors[order.status] || "bg-gray-100"}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `/admin/dashboard/Orders/${order.id}`,
                            "_blank",
                          )
                        }
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No orders yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
