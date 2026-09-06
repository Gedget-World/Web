import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  REFERRAL_ATTRIBUTION_COOKIE,
  mergeAttributionClick,
  parseAttributionCookie,
  serializeAttributionCookie,
} from "@/lib/referrals";

// Public endpoint — fired (fire-and-forget, best-effort) from
// components/product-view-tracker.tsx when a product page is visited with
// a ?ref= query param. Logs the click and stashes attribution in a signed,
// httpOnly cookie so app/(site)/api/orders/route.ts can credit the right
// affiliate at checkout time, without ever trusting client-supplied data.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const linkCode = typeof body?.linkCode === "string" ? body.linkCode : null;

    if (!linkCode) {
      return NextResponse.json({ error: "Missing linkCode" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const [{ data: link }, { data: settingsRows }] = await Promise.all([
      supabase
        .from("referral_links")
        .select("id, product_id, affiliate_id, affiliates!inner(status)")
        .eq("link_code", linkCode)
        .single(),
      supabase
        .from("store_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "referral_program_enabled",
          "referral_attribution_window_days",
        ]),
    ]);

    const settingsMap = Object.fromEntries(
      (settingsRows || []).map((s) => [s.setting_key, s.setting_value]),
    );
    const programEnabled = settingsMap.referral_program_enabled !== "false";
    const windowDays =
      Number(settingsMap.referral_attribution_window_days) || 30;

    if (
      !programEnabled ||
      !link ||
      (link.affiliates as unknown as { status: string }).status !== "approved"
    ) {
      return NextResponse.json({ tracked: false });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    await supabase.from("referral_clicks").insert({
      referral_link_id: link.id,
      ip_address: ip,
      user_agent: request.headers.get("user-agent"),
      referrer_url: typeof body?.pageUrl === "string" ? body.pageUrl : null,
    });

    const existingClicks = parseAttributionCookie(
      request.cookies.get(REFERRAL_ATTRIBUTION_COOKIE)?.value,
    );
    const updatedClicks = mergeAttributionClick(
      existingClicks,
      {
        linkCode,
        productId: link.product_id,
        affiliateId: link.affiliate_id,
        clickedAt: Date.now(),
      },
      windowDays,
    );

    const response = NextResponse.json({ tracked: true });
    response.cookies.set(
      REFERRAL_ATTRIBUTION_COOKIE,
      serializeAttributionCookie(updatedClicks),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: windowDays * 24 * 60 * 60,
        path: "/",
      },
    );
    return response;
  } catch (error) {
    console.error("[referrals/track-click] failed:", error);
    // Never surface tracking failures to the visitor.
    return NextResponse.json({ tracked: false });
  }
}
