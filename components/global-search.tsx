"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Clock, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAutocomplete, useSearchHistory } from "@/hooks/use-search";
import { SearchResultItem, AutocompleteSuggestion } from "@/lib/types/search";
import { createClient } from "@/lib/supabase/client";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<
    SearchResultItem[]
  >([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Autocomplete hook
  const {
    suggestions,
    loading: autocompleteLoading,
    setQuery: setAutocompleteQuery,
    clear: clearAutocomplete,
  } = useAutocomplete({
    debounceMs: 150,
    maxResults: 6,
    enabled: open,
  });

  // Search history hook
  const { history, addToHistory, removeFromHistory } = useSearchHistory();

  // Fetch recommended products (new arrivals)
  const fetchRecommendedProducts = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("products")
        .select(
          "id, name, slug, image_url, price, description, discount_percentage, is_featured, is_new_arrival, is_out_of_stock, stock, sales_count, created_at",
        )
        .eq("is_new_arrival", true)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(4);

      if (data) {
        setRecommendedProducts(
          data.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            price: p.price,
            discountPercentage: p.discount_percentage || 0,
            imageUrl: p.image_url,
            collectionId: null,
            collectionName: null,
            isFeatured: p.is_featured || false,
            isNewArrival: p.is_new_arrival || false,
            isOutOfStock: p.is_out_of_stock || false,
            stock: p.stock || 0,
            salesCount: p.sales_count || 0,
            createdAt: p.created_at,
            rank: 0,
            highlightName: p.name,
            highlightDescription: p.description,
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching recommended products:", error);
    }
  }, [supabase]);

  // Execute full search
  const executeSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&limit=8`,
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.items || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setAutocompleteQuery(value);
    setSelectedIndex(-1);

    // Execute full search with debounce
    const timer = setTimeout(() => {
      executeSearch(value);
    }, 300);

    return () => clearTimeout(timer);
  };

  // Handle suggestion/result click
  const handleResultClick = (
    item: SearchResultItem | { slug: string; name: string },
  ) => {
    const query = inputValue.trim();
    if (query) {
      addToHistory(query);
    }
    router.push(`/products/${item.slug}`);
    handleClose();
  };

  // Handle suggestion click - navigate to products page
  const handleSuggestionClick = (suggestion: AutocompleteSuggestion) => {
    addToHistory(suggestion.suggestion);
    router.push(`/products?q=${encodeURIComponent(suggestion.suggestion)}`);
    handleClose();
  };

  // Handle history item click - navigate to products page
  const handleHistoryClick = (query: string) => {
    addToHistory(query);
    router.push(`/products?q=${encodeURIComponent(query)}`);
    handleClose();
  };

  // Handle search submit - navigate to products page
  const handleSearchSubmit = () => {
    const trimmedQuery = inputValue.trim();
    if (trimmedQuery) {
      addToHistory(trimmedQuery);
      router.push(`/products?q=${encodeURIComponent(trimmedQuery)}`);
      handleClose();
    }
  };

  // Handle close
  const handleClose = () => {
    setOpen(false);
    setInputValue("");
    setSearchResults([]);
    setSelectedIndex(-1);
    clearAutocomplete();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = searchResults.length + suggestions.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
        handleResultClick(searchResults[selectedIndex]);
      } else if (selectedIndex >= searchResults.length) {
        const suggestionIndex = selectedIndex - searchResults.length;
        handleSuggestionClick(suggestions[suggestionIndex]);
      } else {
        // No item selected - submit search
        handleSearchSubmit();
      }
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  // Load recommended products when dialog opens
  useEffect(() => {
    if (open && recommendedProducts.length === 0) {
      fetchRecommendedProducts();
    }
  }, [open, fetchRecommendedProducts, recommendedProducts.length]);

  // Global keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const isLoading = searchLoading || autocompleteLoading;
  const hasQuery = inputValue.trim().length > 0;
  const hasResults = searchResults.length > 0;
  const hasSuggestions = suggestions.length > 0;
  const hasHistory = history.length > 0;

  return (
    <>
      {/* Desktop Search Button */}
      <Button
        variant="outline"
        className="hidden md:flex h-9 w-full justify-start px-3 bg-transparent"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 mr-2" />
        <span className="text-sm text-muted-foreground">
          Search products...
        </span>
        <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Mobile Search Icon */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">Search</span>
      </Button>

      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="sr-only">Search Products</DialogTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search products..."
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-9 h-12 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
          </DialogHeader>

          <div className="border-t" />

          <div className="max-h-[400px] overflow-y-auto px-2 py-2">
            {/* Search Results */}
            {hasQuery && hasResults && (
              <div className="mb-4">
                <div className="flex items-center justify-between px-2 mb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Products
                  </h3>
                  <button
                    onClick={handleSearchSubmit}
                    className="text-xs text-primary hover:underline"
                  >
                    View all results →
                  </button>
                </div>
                <div className="space-y-1">
                  {searchResults.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                        selectedIndex === index
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p
                        className="font-medium text-sm truncate"
                        dangerouslySetInnerHTML={{
                          __html: result.highlightName,
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Autocomplete Suggestions */}
            {hasQuery && hasSuggestions && !hasResults && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Suggestions
                </h3>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.suggestion}-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                        selectedIndex === searchResults.length + index
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      {suggestion.type === "recent_search" ? (
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm">{suggestion.suggestion}</span>
                      {suggestion.productCount > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {suggestion.productCount} products
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {hasQuery && !isLoading && !hasResults && !hasSuggestions && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found for "{inputValue}"
              </div>
            )}

            {/* Recent Searches (when no query) */}
            {!hasQuery && hasHistory && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Recent Searches
                </h3>
                <div className="space-y-1">
                  {history.slice(0, 5).map((query) => (
                    <button
                      key={query}
                      onClick={() => handleHistoryClick(query)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm flex-1">{query}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(query);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Products (New Arrivals - when no query) */}
            {!hasQuery && recommendedProducts.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  New Arrivals
                </h3>
                <div className="space-y-1">
                  {recommendedProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleResultClick(product)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
                    >
                      {product.imageUrl && (
                        <div className="relative h-12 w-12 shrink-0 rounded overflow-hidden bg-muted">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {product.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!hasQuery && !hasHistory && recommendedProducts.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Start typing to search products...
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px]">
                  ↑↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px]">
                  ↵
                </kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border bg-muted text-[10px]">
                  esc
                </kbd>
                Close
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
