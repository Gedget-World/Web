"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  SearchResponse,
  SearchParams,
  SearchFilters,
  SearchSortBy,
  AutocompleteResponse,
  AutocompleteSuggestion,
  FacetsResponse,
  SearchFacets,
  SearchCursor,
  SEARCH_CONFIG,
} from "@/lib/types/search";

// ============================================================================
// Debounce Hook
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// Search State Type
// ============================================================================

interface SearchState {
  results: SearchResponse | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// useSearch Hook - Main search with pagination
// ============================================================================

interface UseSearchOptions {
  initialQuery?: string;
  initialFilters?: SearchFilters;
  initialSortBy?: SearchSortBy;
  pageSize?: number;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseSearchReturn extends SearchState {
  query: string;
  setQuery: (query: string) => void;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  updateFilter: <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K],
  ) => void;
  clearFilters: () => void;
  sortBy: SearchSortBy;
  setSortBy: (sortBy: SearchSortBy) => void;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  refresh: () => void;
  totalCount: number;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    initialQuery = "",
    initialFilters = {},
    initialSortBy = "relevance",
    pageSize = SEARCH_CONFIG.DEFAULT_PAGE_SIZE,
    debounceMs = SEARCH_CONFIG.DEBOUNCE_DELAY,
    enabled = true,
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [sortBy, setSortBy] = useState<SearchSortBy>(initialSortBy);
  const [state, setState] = useState<SearchState>({
    results: null,
    loading: false,
    error: null,
  });
  const [cursor, setCursor] = useState<SearchCursor | null>(null);

  const debouncedQuery = useDebounce(query, debounceMs);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Search function
  const search = useCallback(
    async (
      searchQuery: string,
      searchFilters: SearchFilters,
      searchSortBy: SearchSortBy,
      searchCursor: SearchCursor | null,
      append: boolean = false,
    ) => {
      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      if (!enabled) {
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const params = new URLSearchParams();
        params.set("q", searchQuery);
        params.set("sort", searchSortBy);
        params.set("limit", String(pageSize));

        if (searchFilters.collectionId) {
          params.set("collection", searchFilters.collectionId);
        }
        if (searchFilters.minPrice !== undefined) {
          params.set("minPrice", String(searchFilters.minPrice));
        }
        if (searchFilters.maxPrice !== undefined) {
          params.set("maxPrice", String(searchFilters.maxPrice));
        }
        if (searchFilters.isFeatured) {
          params.set("featured", "true");
        }
        if (searchFilters.isNewArrival) {
          params.set("newArrival", "true");
        }
        if (searchFilters.inStock) {
          params.set("inStock", "true");
        }
        if (searchCursor) {
          params.set("cursorId", searchCursor.id);
          params.set("cursorValue", searchCursor.value);
        }

        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data: SearchResponse = await response.json();

        if (!mountedRef.current) return;

        setState((prev) => ({
          ...prev,
          results:
            append && prev.results
              ? {
                  ...data,
                  items: [...prev.results.items, ...data.items],
                }
              : data,
          loading: false,
        }));

        setCursor(data.nextCursor);
      } catch (error) {
        if (!mountedRef.current) return;

        if (error instanceof Error && error.name === "AbortError") {
          // Request was cancelled, ignore
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Search failed",
        }));
      }
    },
    [enabled, pageSize],
  );

  // Effect to trigger search when query/filters/sort change
  useEffect(() => {
    setCursor(null);
    search(debouncedQuery, filters, sortBy, null, false);
  }, [debouncedQuery, filters, sortBy, search]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Update single filter
  const updateFilter = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Load more results
  const loadMore = useCallback(async () => {
    if (!cursor || state.loading) return;
    await search(debouncedQuery, filters, sortBy, cursor, true);
  }, [cursor, state.loading, debouncedQuery, filters, sortBy, search]);

  // Refresh current results
  const refresh = useCallback(() => {
    setCursor(null);
    search(debouncedQuery, filters, sortBy, null, false);
  }, [debouncedQuery, filters, sortBy, search]);

  return {
    ...state,
    query,
    setQuery,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    sortBy,
    setSortBy,
    loadMore,
    hasMore: state.results?.hasNextPage ?? false,
    refresh,
    totalCount: state.results?.totalCount ?? 0,
  };
}

// ============================================================================
// useAutocomplete Hook - Fast suggestions while typing
// ============================================================================

interface UseAutocompleteOptions {
  maxResults?: number;
  debounceMs?: number;
  minQueryLength?: number;
  enabled?: boolean;
}

interface UseAutocompleteReturn {
  suggestions: AutocompleteSuggestion[];
  loading: boolean;
  error: string | null;
  query: string;
  setQuery: (query: string) => void;
  clear: () => void;
}

export function useAutocomplete(
  options: UseAutocompleteOptions = {},
): UseAutocompleteReturn {
  const {
    maxResults = SEARCH_CONFIG.AUTOCOMPLETE_LIMIT,
    debounceMs = 150, // Shorter debounce for autocomplete
    minQueryLength = SEARCH_CONFIG.MIN_QUERY_LENGTH,
    enabled = true,
  } = options;

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, debounceMs);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!enabled || debouncedQuery.length < minQueryLength) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    abortControllerRef.current = new AbortController();

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          limit: String(maxResults),
        });

        const response = await fetch(
          `/api/search/autocomplete?${params.toString()}`,
          {
            signal: abortControllerRef.current!.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data: AutocompleteResponse = await response.json();
        setSuggestions(data.suggestions);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setError(
          err instanceof Error ? err.message : "Failed to fetch suggestions",
        );
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, maxResults, minQueryLength, enabled]);

  const clear = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    loading,
    error,
    query,
    setQuery,
    clear,
  };
}

// ============================================================================
// useFacets Hook - Filter counts
// ============================================================================

interface UseFacetsOptions {
  query?: string;
  enabled?: boolean;
}

interface UseFacetsReturn {
  facets: SearchFacets | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useFacets(options: UseFacetsOptions = {}): UseFacetsReturn {
  const { query = "", enabled = true } = options;

  const [facets, setFacets] = useState<SearchFacets | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, SEARCH_CONFIG.DEBOUNCE_DELAY);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFacets = useCallback(
    async (searchQuery: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (!enabled) return;

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (searchQuery) {
          params.set("q", searchQuery);
        }

        const response = await fetch(
          `/api/search/facets?${params.toString()}`,
          {
            signal: abortControllerRef.current.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch facets");
        }

        const data: FacetsResponse = await response.json();
        setFacets(data.facets);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to fetch facets");
      } finally {
        setLoading(false);
      }
    },
    [enabled],
  );

  useEffect(() => {
    fetchFacets(debouncedQuery);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedQuery, fetchFacets]);

  const refresh = useCallback(() => {
    fetchFacets(debouncedQuery);
  }, [debouncedQuery, fetchFacets]);

  return {
    facets,
    loading,
    error,
    refresh,
  };
}

// ============================================================================
// useSearchHistory Hook - Local search history storage
// ============================================================================

const SEARCH_HISTORY_KEY = "search_history";
const MAX_HISTORY_ITEMS = 10;

interface UseSearchHistoryReturn {
  history: string[];
  addToHistory: (query: string) => void;
  removeFromHistory: (query: string) => void;
  clearHistory: () => void;
}

export function useSearchHistory(): UseSearchHistoryReturn {
  const [history, setHistory] = useState<string[]>([]);

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const addToHistory = useCallback((query: string) => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery || normalizedQuery.length < 2) return;

    setHistory((prev) => {
      const filtered = prev.filter((q) => q.toLowerCase() !== normalizedQuery);
      const updated = [query.trim(), ...filtered].slice(0, MAX_HISTORY_ITEMS);

      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }

      return updated;
    });
  }, []);

  const removeFromHistory = useCallback((query: string) => {
    setHistory((prev) => {
      const updated = prev.filter((q) => q !== query);

      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }

      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
