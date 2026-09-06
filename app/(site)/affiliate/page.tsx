import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AffiliateDashboardClient } from "@/components/affiliate-dashboard-client";

export default async function AffiliatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/affiliate");
  }

  return <AffiliateDashboardClient />;
}
