import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getSearchFacets,
  getCachedSearch,
  setCachedSearch,
} from "@/lib/search";
import { FacetsResponse, SEARCH_CONFIG } from "@/lib/types/search";

export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || undefined;

    // Check cache
    const cacheKey = `facets:${(query || "").toLowerCase()}`;
    const cached = getCachedSearch<FacetsResponse>(
      cacheKey,
      SEARCH_CONFIG.CACHE_TTL.FACETS,
    );

    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "X-Cache": "HIT",
          "X-Response-Time": `${Math.round(performance.now() - startTime)}ms`,
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    // Get facets
    const supabase = await createClient();
    const response = await getSearchFacets(supabase, query);

    // Cache the results
    setCachedSearch(cacheKey, response);

    return NextResponse.json(response, {
      headers: {
        "X-Cache": "MISS",
        "X-Response-Time": `${response.executionTimeMs}ms`,
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Facets API error:", error);

    return NextResponse.json(
      {
        error: "Failed to get facets",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
