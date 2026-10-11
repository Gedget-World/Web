import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { TiffinDaySelector } from "@/components/tiffin-day-selector";

export default async function Tiffin7HillsPgPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?redirect=/tiffin-7Hills-PG");

  const [{ data: request }, serviceClient] = await Promise.all([
    supabase
      .from("tiffin_requests")
      .select("id, status, selected_dates, created_at, updated_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    Promise.resolve(createServiceClient()),
  ]);

  const { data: approvedRequests } = await serviceClient
    .from("tiffin_requests")
    .select("user_id, selected_dates")
    .eq("status", "approved");

  const userIds = (approvedRequests || []).map(
    (approvedRequest) => approvedRequest.user_id,
  );
  const { data: customers } = userIds.length
    ? await serviceClient
        .from("customers")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds)
    : { data: [] };

  const customerNames = new Map(
    (customers || []).map((customer) => [
      customer.user_id,
      [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
        "Resident",
    ]),
  );
  const sharedPeople = (approvedRequests || []).map((approvedRequest) => ({
    name: customerNames.get(approvedRequest.user_id) || "Resident",
    selectedDates: approvedRequest.selected_dates || [],
    isCurrentUser: approvedRequest.user_id === user.id,
  }));

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fffaf0_0%,#f8fafc_48%,#eef7f1_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            7 Hills PG · Tiffin
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Plan your tiffin days
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Request access first, then choose the future days that fit your
            week. You can also see how many approved residents selected each
            date.
          </p>
        </div>
        <TiffinDaySelector
          initialRequest={request}
          sharedPeople={sharedPeople}
        />
      </div>
    </main>
  );
}
