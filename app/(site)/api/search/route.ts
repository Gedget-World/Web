import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  searchProducts,
  getSearchCacheKey,
  getCachedSearch,
  setCachedSearch,
} from "@/lib/search";
import {
  SearchParams,
  SearchResponse,
  SearchFilters,
  SearchSortBy,
  SEARCH_CONFIG,
} from "@/lib/types/search";

// Rate limiting state (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const limit = SEARCH_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE;

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const startTime = performance.now();

  // Get client IP for rate limiting
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Check rate limit
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(
            SEARCH_CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE,
          ),
        },
      },
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query = searchParams.get("q") || "";
    const collectionId = searchParams.get("collection") || undefined;
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined;
    const isFeatured =
      searchParams.get("featured") === "true" ? true : undefined;
    const isNewArrival =
      searchParams.get("newArrival") === "true" ? true : undefined;
    const inStock = searchParams.get("inStock") === "true" ? true : undefined;
    const sortBy = (searchParams.get("sort") as SearchSortBy) || "relevance";
    const pageSize = parseInt(searchParams.get("limit") || "20", 10);
    const cursorId = searchParams.get("cursorId") || undefined;
    const cursorValue = searchParams.get("cursorValue") || undefined;

    // Validate page size
    const validatedPageSize = Math.min(
      Math.max(1, pageSize),
      SEARCH_CONFIG.MAX_PAGE_SIZE,
    );

    // Build search params
    const filters: SearchFilters = {
      collectionId,
      minPrice,
      maxPrice,
      isFeatured,
      isNewArrival,
      inStock,
    };

    const params: SearchParams = {
      query,
      filters,
      sortBy,
      pageSize: validatedPageSize,
      cursor:
        cursorId && cursorValue
          ? { id: cursorId, value: cursorValue }
          : undefined,
    };

    // Check cache
    const cacheKey = getSearchCacheKey(params);
    const cached = getCachedSearch<SearchResponse>(
      cacheKey,
      SEARCH_CONFIG.CACHE_TTL.SEARCH_RESULTS,
    );

    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "X-Cache": "HIT",
          "X-Response-Time": `${Math.round(performance.now() - startTime)}ms`,
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    }

    // Execute search
    const supabase = await createClient();
    const response = await searchProducts(supabase, params);

    // Cache the results
    setCachedSearch(cacheKey, response);

    return NextResponse.json(response, {
      headers: {
        "X-Cache": "MISS",
        "X-Response-Time": `${response.executionTimeMs}ms`,
        "X-Total-Count": String(response.totalCount),
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Search API error:", error);

    return NextResponse.json(
      {
        error: "Search failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
