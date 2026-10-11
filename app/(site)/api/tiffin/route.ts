import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PLANNING_DAYS = 90;

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function planningEndUtc() {
  const date = new Date(`${todayUtc()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + MAX_PLANNING_DAYS);
  return date.toISOString().slice(0, 10);
}

function isRealDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return date.toISOString().slice(0, 10) === value;
}

function validateDates(value: unknown) {
  if (!Array.isArray(value) || value.length > MAX_PLANNING_DAYS) {
    return { dates: null, error: "Select up to 90 future dates." };
  }

  const dates = [...new Set(value)].filter(
    (date): date is string => typeof date === "string",
  );
  const today = todayUtc();

  const planningEnd = planningEndUtc();
  if (
    dates.some(
      (date) => !isRealDate(date) || date <= today || date > planningEnd,
    )
  ) {
    return {
      dates: null,
      error: "Select valid dates within the next 90 days.",
    };
  }

  return { dates: dates.sort(), error: null };
}

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("tiffin_requests")
    .select("id, status, selected_dates, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[tiffin] failed to load request:", error);
    return NextResponse.json(
      { error: "Could not load your tiffin request." },
      { status: 500 },
    );
  }

  return NextResponse.json({ request: data });
}

export async function POST() {
  const { supabase, user } = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("tiffin_requests")
    .insert({ user_id: user.id })
    .select("id, status, selected_dates, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Your tiffin request already exists." },
        { status: 409 },
      );
    }
    console.error("[tiffin] failed to create request:", error);
    return NextResponse.json(
      { error: "Could not create your tiffin request." },
      { status: 500 },
    );
  }

  return NextResponse.json({ request: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const validation = validateDates(body?.selectedDates);
  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { data: existing, error: readError } = await supabase
    .from("tiffin_requests")
    .select("id, status, selected_dates")
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError) {
    console.error("[tiffin] failed to read request before update:", readError);
    return NextResponse.json(
      { error: "Could not update your tiffin dates." },
      { status: 500 },
    );
  }
  if (!existing)
    return NextResponse.json(
      { error: "Request access first." },
      { status: 404 },
    );
  if (existing.status !== "approved") {
    return NextResponse.json(
      { error: "Your request must be approved before selecting dates." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from("tiffin_requests")
    .update({ selected_dates: validation.dates })
    .eq("id", existing.id)
    .select("id, status, selected_dates, created_at, updated_at")
    .single();

  if (error) {
    console.error("[tiffin] failed to update dates:", error);
    return NextResponse.json(
      { error: "Could not save your tiffin dates." },
      { status: 500 },
    );
  }

  return NextResponse.json({ request: data });
}
