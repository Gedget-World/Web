// ============================================================================
// Search Types & Interfaces
// PostgreSQL Full-Text Search with Elasticsearch-like features
// ============================================================================

/**
 * Sort options for search results
 */
export type SearchSortBy =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "popularity";

export type SearchSortOrder = "asc" | "desc";

/**
 * Search filter parameters
 */
export interface SearchFilters {
  collectionId?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  inStock?: boolean;
}

/**
 * Pagination using cursor-based approach (more efficient than offset)
 */
export interface SearchCursor {
  id: string;
  value: string;
}

/**
 * Main search request parameters
 */
export interface SearchParams {
  query: string;
  filters?: SearchFilters;
  sortBy?: SearchSortBy;
  sortOrder?: SearchSortOrder;
  pageSize?: number;
  cursor?: SearchCursor;
}

/**
 * Individual search result item
 */
export interface SearchResultItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discountPercentage: number;
  imageUrl: string | null;
  collectionId: string | null;
  collectionName: string | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isOutOfStock: boolean;
  stock: number;
  salesCount: number;
  createdAt: string;
  rank: number;
  highlightName: string;
  highlightDescription: string | null;
}

/**
 * Search response with results and pagination info
 */
export interface SearchResponse {
  items: SearchResultItem[];
  totalCount: number;
  hasNextPage: boolean;
  nextCursor: SearchCursor | null;
  query: string;
  executionTimeMs: number;
}

/**
 * Autocomplete suggestion types
 */
export type SuggestionType = "product" | "recent_search" | "popular";

/**
 * Individual autocomplete suggestion
 */
export interface AutocompleteSuggestion {
  suggestion: string;
  type: SuggestionType;
  matchScore: number;
  productCount: number;
}

/**
 * Autocomplete response
 */
export interface AutocompleteResponse {
  suggestions: AutocompleteSuggestion[];
  query: string;
  executionTimeMs: number;
}

/**
 * Facet item for filters
 */
export interface SearchFacetItem {
  value: string;
  id: string | null;
  count: number;
}

/**
 * All facets organized by type
 */
export interface SearchFacets {
  collections: SearchFacetItem[];
  priceRanges: SearchFacetItem[];
  isFeatured: SearchFacetItem | null;
  isNewArrival: SearchFacetItem | null;
}

/**
 * Facets response
 */
export interface FacetsResponse {
  facets: SearchFacets;
  query: string;
  executionTimeMs: number;
}

/**
 * Error response from search API
 */
export interface SearchError {
  code: string;
  message: string;
  details?: string;
}

/**
 * Price range for filtering
 */
export interface PriceRange {
  label: string;
  min: number | null;
  max: number | null;
}

/**
 * Predefined price ranges
 */
export const PRICE_RANGES: PriceRange[] = [
  { label: "Under ₹500", min: null, max: 500 },
  { label: "₹500 - ₹1,000", min: 500, max: 1000 },
  { label: "₹1,000 - ₹2,500", min: 1000, max: 2500 },
  { label: "₹2,500 - ₹5,000", min: 2500, max: 5000 },
  { label: "₹5,000 - ₹10,000", min: 5000, max: 10000 },
  { label: "Over ₹10,000", min: 10000, max: null },
];

/**
 * Search configuration constants
 */
export const SEARCH_CONFIG = {
  // Debounce delay for search input (ms)
  DEBOUNCE_DELAY: 300,

  // Minimum query length to trigger search
  MIN_QUERY_LENGTH: 2,

  // Default page size
  DEFAULT_PAGE_SIZE: 20,

  // Maximum page size
  MAX_PAGE_SIZE: 50,

  // Autocomplete result limit
  AUTOCOMPLETE_LIMIT: 8,

  // Cache TTL in seconds
  CACHE_TTL: {
    SEARCH_RESULTS: 60, // 1 minute
    AUTOCOMPLETE: 300, // 5 minutes
    FACETS: 300, // 5 minutes
    POPULAR_SEARCHES: 3600, // 1 hour
  },

  // Rate limiting
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 60,
    MAX_REQUESTS_PER_SECOND: 10,
  },
} as const;

/**
 * Search analytics event types
 */
export type SearchEventType =
  | "search_performed"
  | "search_result_clicked"
  | "autocomplete_used"
  | "filter_applied"
  | "sort_changed";

/**
 * Search analytics payload
 */
export interface SearchAnalyticsEvent {
  type: SearchEventType;
  query: string;
  filters?: SearchFilters;
  sortBy?: SearchSortBy;
  resultCount?: number;
  clickedItemId?: string;
  clickedPosition?: number;
  timestamp: number;
}

/**
 * Database function parameter types (for RPC calls)
 */
export interface SearchProductsRpcParams {
  search_query: string;
  filter_collection_id?: string | null;
  filter_min_price?: number | null;
  filter_max_price?: number | null;
  filter_is_featured?: boolean | null;
  filter_is_new_arrival?: boolean | null;
  filter_in_stock?: boolean | null;
  sort_by?: string;
  sort_order?: string;
  page_size?: number;
  cursor_id?: string | null;
  cursor_value?: string | null;
}

/**
 * Raw database response row
 */
export interface SearchProductsRpcResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discount_percentage: number;
  image_url: string | null;
  collection_id: string | null;
  collection_name: string | null;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_out_of_stock: boolean;
  stock: number;
  sales_count: number;
  created_at: string;
  rank: number;
  highlight_name: string;
  highlight_description: string | null;
  total_count: number;
}

export interface AutocompleteRpcResponse {
  suggestion: string;
  suggestion_type: string;
  match_score: number;
  product_count: number;
}

export interface FacetRpcResponse {
  facet_type: string;
  facet_value: string;
  facet_id: string | null;
  count: number;
}
