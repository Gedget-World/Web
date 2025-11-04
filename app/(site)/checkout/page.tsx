import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CheckoutForm } from "@/components/checkout-form"

export default async function CheckoutPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/checkout")
  }

  return (
    <main className="min-h-screen py-12 px-4 md:px-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">Checkout</h1>
      <CheckoutForm user={user} />
    </main>
  )
}
