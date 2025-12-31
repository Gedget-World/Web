import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerProfileForm } from "@/components/customer-profile-form";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/profile");
  }

  // Get customer data
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get user's order count
  const { count: orderCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <div className="container max-w-4xl py-12 px-4 md:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">My Profile</h1>
        <p className="text-slate-600">
          Manage your account information and view your order history
        </p>
      </div>

      <div className="grid gap-6">
        {/* Customer Profile Form */}
        <CustomerProfileForm 
          user={{
            id: user.id,
            email: user.email || ""
          }} 
          initialCustomer={customer} 
        />

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <User className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">User ID</p>
                <p className="text-sm text-slate-900 font-mono">
                  {user.id.slice(0, 8)}...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <Mail className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Email</p>
                <p className="text-sm text-slate-900">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <Calendar className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Member Since
                </p>
                <p className="text-sm text-slate-900">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order History */}
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>View and track your orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {orderCount || 0}
                </p>
                <p className="text-sm text-slate-600">Total Orders</p>
              </div>
              <Button asChild>
                <Link href="/orders">View All Orders</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
