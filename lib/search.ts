// ============================================================================
// Search Utility Library
// Server-side search functions using PostgreSQL Full-Text Search
// ============================================================================

import { SupabaseClient } from "@supabase/supabase-js";
import {
  SearchParams,
  SearchResponse,
  SearchResultItem,
  AutocompleteResponse,
  AutocompleteSuggestion,
  FacetsResponse,
  SearchFacets,
  SearchProductsRpcParams,
  SearchProductsRpcResponse,
  AutocompleteRpcResponse,
  FacetRpcResponse,
  SEARCH_CONFIG,
} from "@/lib/types/search";

/**
 * Sanitize search query to prevent SQL injection and invalid tsquery syntax
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return "";

  return (
    query
      // Remove special PostgreSQL tsquery characters
      .replace(/[&|!():*<>]/g, " ")
      // Remove quotes that could break queries
      .replace(/['"]/g, "")
      // Collapse multiple spaces
      .replace(/\s+/g, " ")
      // Trim whitespace
      .trim()
      // Limit length to prevent DoS
      .slice(0, 100)
  );
}

/**
 * Normalize query for comparison and storage
 */
export function normalizeQuery(query: string): string {
  return sanitizeSearchQuery(query).toLowerCase();
}

/**
 * Transform raw database response to SearchResultItem
 */
function transformSearchResult(
  row: SearchProductsRpcResponse,
): SearchResultItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    discountPercentage: row.discount_percentage,
    imageUrl: row.image_url,
    collectionId: row.collection_id,
    collectionName: row.collection_name,
    isFeatured: row.is_featured,
    isNewArrival: row.is_new_arrival,
    isOutOfStock: row.is_out_of_stock,
    stock: row.stock,
    salesCount: row.sales_count,
    createdAt: row.created_at,
    rank: row.rank,
    highlightName: row.highlight_name,
    highlightDescription: row.highlight_description,
  };
}

/**
 * Main search function - calls the PostgreSQL search_products function
 */
export async function searchProducts(
  supabase: SupabaseClient,
  params: SearchParams,
): Promise<SearchResponse> {
  const startTime = performance.now();

  const sanitizedQuery = sanitizeSearchQuery(params.query);
  const pageSize = Math.min(
    params.pageSize || SEARCH_CONFIG.DEFAULT_PAGE_SIZE,
    SEARCH_CONFIG.MAX_PAGE_SIZE,
  );

  // Build RPC parameters
  const rpcParams: SearchProductsRpcParams = {
    search_query: sanitizedQuery,
    filter_collection_id: params.filters?.collectionId || null,
    filter_min_price: params.filters?.minPrice ?? null,
    filter_max_price: params.filters?.maxPrice ?? null,
    filter_is_featured: params.filters?.isFeatured ?? null,
    filter_is_new_arrival: params.filters?.isNewArrival ?? null,
    filter_in_stock: params.filters?.inStock ?? null,
    sort_by: params.sortBy || "relevance",
    sort_order: params.sortOrder || "desc",
    page_size: pageSize + 1, // Fetch one extra to check if there's a next page
    cursor_id: params.cursor?.id || null,
    cursor_value: params.cursor?.value || null,
  };

  const { data, error } = await supabase.rpc("search_products", rpcParams);

  if (error) {
    console.error("Search error:", error);
    throw new Error(`Search failed: ${error.message}`);
  }

  const rows = (data || []) as SearchProductsRpcResponse[];
  const hasNextPage = rows.length > pageSize;
  const results = rows.slice(0, pageSize);

  // Get total count from first result (all rows have the same total_count)
  const totalCount = results.length > 0 ? results[0].total_count : 0;

  // Build next cursor from the last result
  let nextCursor = null;
  if (hasNextPage && results.length > 0) {
    const lastItem = results[results.length - 1];
    const cursorValue = getCursorValue(lastItem, params.sortBy || "relevance");
    nextCursor = {
      id: lastItem.id,
      value: cursorValue,
    };
  }

  // Track search query (fire and forget)
  trackSearchQuery(supabase, sanitizedQuery, totalCount).catch(() => {});

  return {
    items: results.map(transformSearchResult),
    totalCount,
    hasNextPage,
    nextCursor,
    query: sanitizedQuery,
    executionTimeMs: Math.round(performance.now() - startTime),
  };
}

/**
 * Get cursor value based on sort field
 */
function getCursorValue(
  item: SearchProductsRpcResponse,
  sortBy: string,
): string {
  switch (sortBy) {
    case "price_asc":
    case "price_desc":
      return String(item.price);
    case "newest":
      return item.created_at;
    case "popularity":
      return String(item.sales_count);
    case "relevance":
    default:
      return String(item.rank);
  }
}

/**
 * Autocomplete function - fast prefix-based suggestions
 */
export async function getAutocompleteSuggestions(
  supabase: SupabaseClient,
  prefix: string,
  maxResults: number = SEARCH_CONFIG.AUTOCOMPLETE_LIMIT,
): Promise<AutocompleteResponse> {
  const startTime = performance.now();

  const sanitizedPrefix = sanitizeSearchQuery(prefix);

  if (sanitizedPrefix.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
    return {
      suggestions: [],
      query: sanitizedPrefix,
      executionTimeMs: 0,
    };
  }

  const { data, error } = await supabase.rpc("search_autocomplete", {
    prefix: sanitizedPrefix,
    max_results: maxResults,
  });

  if (error) {
    console.error("Autocomplete error:", error);
    throw new Error(`Autocomplete failed: ${error.message}`);
  }

  const rows = (data || []) as AutocompleteRpcResponse[];

  const suggestions: AutocompleteSuggestion[] = rows.map((row) => ({
    suggestion: row.suggestion,
    type: row.suggestion_type as AutocompleteSuggestion["type"],
    matchScore: row.match_score,
    productCount: row.product_count,
  }));

  return {
    suggestions,
    query: sanitizedPrefix,
    executionTimeMs: Math.round(performance.now() - startTime),
  };
}

/**
 * Get facets for filtering
 */
export async function getSearchFacets(
  supabase: SupabaseClient,
  query?: string,
): Promise<FacetsResponse> {
  const startTime = performance.now();

  const sanitizedQuery = query ? sanitizeSearchQuery(query) : null;

  const { data, error } = await supabase.rpc("get_search_facets", {
    search_query: sanitizedQuery,
  });

  if (error) {
    console.error("Facets error:", error);
    throw new Error(`Failed to get facets: ${error.message}`);
  }

  const rows = (data || []) as FacetRpcResponse[];

  // Organize facets by type
  const facets: SearchFacets = {
    collections: [],
    priceRanges: [],
    isFeatured: null,
    isNewArrival: null,
  };

  for (const row of rows) {
    switch (row.facet_type) {
      case "collection":
        facets.collections.push({
          value: row.facet_value,
          id: row.facet_id,
          count: row.count,
        });
        break;
      case "price_range":
        facets.priceRanges.push({
          value: row.facet_value,
          id: null,
          count: row.count,
        });
        break;
      // "is_featured" facet counting intentionally not processed/used.
      // "is_new_arrival" facet counting intentionally not processed/used.
    }
  }

  return {
    facets,
    query: sanitizedQuery || "",
    executionTimeMs: Math.round(performance.now() - startTime),
  };
}

/**
 * Track search query for analytics and suggestions
 */
export async function trackSearchQuery(
  supabase: SupabaseClient,
  query: string,
  resultCount: number,
): Promise<void> {
  const sanitizedQuery = sanitizeSearchQuery(query);

  if (sanitizedQuery.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
    return;
  }

  try {
    await supabase.rpc("track_search_query", {
      query_text_input: sanitizedQuery,
      result_count_input: resultCount,
    });
  } catch (error) {
    // Log but don't throw - tracking is non-critical
    console.error("Failed to track search query:", error);
  }
}

/**
 * Get popular search queries
 */
export async function getPopularSearches(
  supabase: SupabaseClient,
  limit: number = 10,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("mv_popular_searches")
    .select("query_text")
    .order("search_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to get popular searches:", error);
    return [];
  }

  return (data || []).map((row) => row.query_text);
}

/**
 * Simple in-memory cache for search results (for edge/serverless)
 * In production, use Redis or similar
 */
const searchCache = new Map<string, { data: unknown; timestamp: number }>();

export function getCachedSearch<T>(key: string, ttlSeconds: number): T | null {
  const cached = searchCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > ttlSeconds * 1000) {
    searchCache.delete(key);
    return null;
  }

  return cached.data as T;
}

export function setCachedSearch<T>(key: string, data: T): void {
  // Limit cache size to prevent memory issues
  if (searchCache.size > 1000) {
    // Delete oldest entries
    const entries = Array.from(searchCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 100; i++) {
      searchCache.delete(entries[i][0]);
    }
  }

  searchCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Generate cache key from search params
 */
export function getSearchCacheKey(params: SearchParams): string {
  return `search:${JSON.stringify({
    q: normalizeQuery(params.query),
    f: params.filters,
    s: params.sortBy,
    p: params.pageSize,
    c: params.cursor,
  })}`;
}

/**
 * Highlight matching text in a string (client-side alternative to ts_headline)
 */
export function highlightMatches(
  text: string,
  query: string,
  startTag: string = "<mark>",
  endTag: string = "</mark>",
): string {
  if (!text || !query) return text;

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  let result = text;

  for (const word of words) {
    if (word.length < 2) continue;
    const regex = new RegExp(`(${escapeRegExp(word)})`, "gi");
    result = result.replace(regex, `${startTag}$1${endTag}`);
  }

  return result;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Calculate discounted price
 */
export function calculateDiscountedPrice(
  price: number,
  discountPercentage: number,
): number {
  if (!discountPercentage || discountPercentage <= 0) return price;
  return price * (1 - discountPercentage / 100);
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}
