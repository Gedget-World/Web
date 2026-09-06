import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLinkCode } from "@/lib/referrals";

async function getApprovedAffiliate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, status")
    .eq("user_id", userId)
    .single();
  return affiliate;
}

// GET — list the logged-in affiliate's referral links with product info.
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const affiliate = await getApprovedAffiliate(supabase, user.id);
    if (!affiliate) {
      return NextResponse.json({ links: [] });
    }

    const { data: links, error } = await supabase
      .from("referral_links")
      .select(
        "id, product_id, link_code, clicks_count, created_at, products(name, slug, image_url, price)",
      )
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ links: links || [] });
  } catch (error) {
    console.error("[referrals/links] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch links" },
      { status: 500 },
    );
  }
}

// POST — create (or fetch the existing) referral link for a product.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const productId =
      typeof body?.productId === "string" ? body.productId : null;
    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const affiliate = await getApprovedAffiliate(supabase, user.id);
    if (!affiliate || affiliate.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved affiliates can create referral links" },
        { status: 403 },
      );
    }

    const { data: existingLink } = await supabase
      .from("referral_links")
      .select(
        "id, product_id, link_code, clicks_count, created_at, products(name, slug, image_url, price)",
      )
      .eq("affiliate_id", affiliate.id)
      .eq("product_id", productId)
      .single();

    if (existingLink) {
      return NextResponse.json({ link: existingLink });
    }

    // link_code is UNIQUE — retry a handful of times on the (astronomically
    // unlikely) chance of a collision rather than failing the request.
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: created, error } = await supabase
        .from("referral_links")
        .insert({
          affiliate_id: affiliate.id,
          product_id: productId,
          link_code: generateLinkCode(),
        })
        .select(
          "id, product_id, link_code, clicks_count, created_at, products(name, slug, image_url, price)",
        )
        .single();

      if (!error) {
        return NextResponse.json({ link: created });
      }
      lastError = error;
      if (
        !String((error as { message?: string }).message).includes("link_code")
      ) {
        break; // not a link_code collision — don't retry
      }
    }

    throw lastError;
  } catch (error) {
    console.error("[referrals/links] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to create link" },
      { status: 500 },
    );
  }
}
