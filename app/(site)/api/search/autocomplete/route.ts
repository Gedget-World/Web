import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAutocompleteSuggestions,
  getCachedSearch,
  setCachedSearch,
} from "@/lib/search";
import { AutocompleteResponse, SEARCH_CONFIG } from "@/lib/types/search";

export async function GET(request: NextRequest) {
  const startTime = performance.now();

  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "8", 10);

    // Validate limit
    const validatedLimit = Math.min(Math.max(1, limit), 20);

    // Check if query is too short
    if (prefix.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      return NextResponse.json({
        suggestions: [],
        query: prefix,
        executionTimeMs: 0,
      } as AutocompleteResponse);
    }

    // Check cache
    const cacheKey = `autocomplete:${prefix.toLowerCase()}:${validatedLimit}`;
    const cached = getCachedSearch<AutocompleteResponse>(
      cacheKey,
      SEARCH_CONFIG.CACHE_TTL.AUTOCOMPLETE,
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

    // Get suggestions
    const supabase = await createClient();
    const response = await getAutocompleteSuggestions(
      supabase,
      prefix,
      validatedLimit,
    );

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
    console.error("Autocomplete API error:", error);

    return NextResponse.json(
      {
        error: "Autocomplete failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
