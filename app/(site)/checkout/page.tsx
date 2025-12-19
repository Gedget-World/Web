import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";

export default async function CheckoutPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/checkout");
  }

  return (
    <main className="min-h-screen py-6 px-4 md:px-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Secure Checkout</h1>
      <p className="text-slate-600 mb-6 text-sm">
        Complete your purchase securely by providing your payment and shipping
        information below.
      </p>
      <CheckoutForm user={user} />
    </main>
  );
}
