import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { DEFAULT_INVOICE_TEMPLATE } from "@/lib/invoice-template";

const SETTING_KEY = "invoice_template_html";
const MAX_TEMPLATE_LENGTH = 100_000;

async function validateAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session_token")?.value;
  if (!sessionToken) return false;

  const supabase = createServiceClient();
  const { data: session, error } = await supabase
    .from("admin_sessions")
    .select("admin_id, expires_at")
    .eq("session_token", sessionToken)
    .single();

  return Boolean(
    !error && session && new Date(session.expires_at).getTime() > Date.now(),
  );
}

export async function GET() {
  try {
    if (!(await validateAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("setting_value")
      .eq("setting_key", SETTING_KEY)
      .maybeSingle();

    if (error) {
      console.error("Error fetching invoice template:", error);
      return NextResponse.json(
        { error: "Failed to fetch invoice template" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      template: data?.setting_value || DEFAULT_INVOICE_TEMPLATE,
    });
  } catch (error) {
    console.error("Error in invoice-template GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await validateAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (
      typeof body?.template !== "string" ||
      !body.template.trim() ||
      body.template.length > MAX_TEMPLATE_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Template must be a non-empty string under ${MAX_TEMPLATE_LENGTH} characters`,
        },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { data: existing, error: lookupError } = await supabase
      .from("store_settings")
      .select("id")
      .eq("setting_key", SETTING_KEY)
      .maybeSingle();

    if (lookupError) {
      console.error("Error looking up invoice template setting:", lookupError);
      return NextResponse.json(
        { error: "Failed to save invoice template" },
        { status: 500 },
      );
    }

    const result = existing
      ? await supabase
          .from("store_settings")
          .update({ setting_value: body.template })
          .eq("setting_key", SETTING_KEY)
      : await supabase.from("store_settings").insert({
          setting_key: SETTING_KEY,
          setting_value: body.template,
          setting_type: "string",
          category: "general",
          label: "Invoice template HTML",
          display_order: 0,
          is_required: false,
        });

    if (result.error) {
      console.error("Error saving invoice template:", result.error);
      return NextResponse.json(
        { error: "Failed to save invoice template" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Invoice template saved" });
  } catch (error) {
    console.error("Error in invoice-template PUT:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
