"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Filter,
  SlidersHorizontal,
  ChevronDown,
  X,
  Loader2,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSearch, useFacets } from "@/hooks/use-search";
import { SearchSortBy, PRICE_RANGES } from "@/lib/types/search";
import { ProductCard } from "@/components/product-card";

export function ProductsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const initialCollection = searchParams.get("collection") || undefined;
  const initialMinPrice = searchParams.get("minPrice")
    ? Number(searchParams.get("minPrice"))
    : undefined;
  const initialMaxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : undefined;
  const initialFeatured = searchParams.get("featured") === "true" || undefined;
  const initialNewArrival =
    searchParams.get("newArrival") === "true" || undefined;
  const initialInStock = searchParams.get("inStock") === "true" || undefined;
  const initialSort = (searchParams.get("sort") as SearchSortBy) || "newest";

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(initialQuery);

  // Collections state for filter sidebar
  interface CollectionItem {
    id: string;
    name: string;
    slug: string;
    count: number;
  }
  const [allCollections, setAllCollections] = useState<CollectionItem[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [collectionSearchQuery, setCollectionSearchQuery] = useState("");
  const [visibleCollectionsCount, setVisibleCollectionsCount] = useState(5);
  const COLLECTIONS_PER_LOAD = 5;

  // Track selected collection slug for URL (resolve to ID for filtering)
  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState<
    string | undefined
  >(initialCollection);

  // Resolve slug to ID for filtering
  const getCollectionIdFromSlug = (slug: string | undefined) => {
    if (!slug || allCollections.length === 0) return undefined;
    const collection = allCollections.find((c) => c.slug === slug);
    return collection?.id;
  };

  // Search hook with initial values from URL
  const {
    results,
    loading,
    error,
    query,
    setQuery,
    filters,
    updateFilter,
    clearFilters,
    sortBy,
    setSortBy,
    loadMore,
    hasMore,
    totalCount,
  } = useSearch({
    initialQuery,
    initialFilters: {
      collectionId: undefined, // Will be set after collections load
      minPrice: initialMinPrice,
      maxPrice: initialMaxPrice,
      isFeatured: initialFeatured,
      isNewArrival: initialNewArrival,
      inStock: initialInStock,
    },
    initialSortBy: initialSort,
    debounceMs: 300,
  });

  // Sync selectedCollectionSlug with URL when navigating (client-side navigation)
  useEffect(() => {
    const collectionFromUrl = searchParams.get("collection") || undefined;
    if (collectionFromUrl !== selectedCollectionSlug) {
      setSelectedCollectionSlug(collectionFromUrl);
    }
  }, [searchParams]);

  // Update collection filter when collections load or slug changes
  useEffect(() => {
    if (!collectionsLoading && allCollections.length > 0) {
      const collectionId = getCollectionIdFromSlug(selectedCollectionSlug);
      if (collectionId !== filters.collectionId) {
        updateFilter("collectionId", collectionId);
      }
    }
  }, [selectedCollectionSlug, allCollections, collectionsLoading]);

  // Facets hook
  const { facets, loading: facetsLoading } = useFacets({ query });

  // Fetch all collections on mount
  useEffect(() => {
    async function fetchCollections() {
      try {
        setCollectionsLoading(true);
        const response = await fetch("/api/collections");
        if (response.ok) {
          const data = await response.json();
          setAllCollections(data.collections || []);
        }
      } catch (error) {
        console.error("Failed to fetch collections:", error);
      } finally {
        setCollectionsLoading(false);
      }
    }
    fetchCollections();
  }, []);

  // Filter collections by search query
  const filteredCollections = allCollections.filter((collection) =>
    collection.name.toLowerCase().includes(collectionSearchQuery.toLowerCase()),
  );

  // Collections to display (with load more logic)
  const displayedCollections = filteredCollections.slice(
    0,
    visibleCollectionsCount,
  );
  const hasMoreCollections =
    filteredCollections.length > visibleCollectionsCount;

  // Load more collections
  const loadMoreCollections = () => {
    setVisibleCollectionsCount((prev) => prev + COLLECTIONS_PER_LOAD);
  };

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCollectionsCount(5);
  }, [collectionSearchQuery]);

  // Sync search input with debounced query
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setQuery]);

  // Update URL when query/filters/sort change (use slug for collection)
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCollectionSlug)
      params.set("collection", selectedCollectionSlug);
    if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    if (filters.isFeatured) params.set("featured", "true");
    if (filters.isNewArrival) params.set("newArrival", "true");
    if (filters.inStock) params.set("inStock", "true");
    if (sortBy !== "newest") params.set("sort", sortBy);

    const newUrl = `/products${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(newUrl, { scroll: false });
  }, [query, selectedCollectionSlug, filters, sortBy, router]);

  // Handle price range selection
  const handlePriceRange = (min: number | null, max: number | null) => {
    updateFilter("minPrice", min ?? undefined);
    updateFilter("maxPrice", max ?? undefined);
  };

  // Handle clear all filters
  const handleClearFilters = () => {
    setSearchInput("");
    setSelectedCollectionSlug(undefined);
    clearFilters();
  };

  // Get active filter count (use slug for collection)
  const activeFilterCount =
    (query ? 1 : 0) +
    (selectedCollectionSlug ? 1 : 0) +
    (filters.minPrice !== undefined ? 1 : 0) +
    (filters.maxPrice !== undefined ? 1 : 0) +
    (filters.isFeatured ? 1 : 0) +
    (filters.isNewArrival ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  // Render filters sidebar content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Collections */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium">
          Collections
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {/* Collection Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search collections..."
              value={collectionSearchQuery}
              onChange={(e) => setCollectionSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          {/* Collections List */}
          {collectionsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : filteredCollections.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {collectionSearchQuery
                ? "No collections found"
                : "No collections available"}
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {displayedCollections.map((collection) => (
                  <label
                    key={collection.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/50 rounded px-1 py-0.5 -mx-1 transition-colors"
                  >
                    <Checkbox
                      checked={selectedCollectionSlug === collection.slug}
                      onCheckedChange={(checked) =>
                        setSelectedCollectionSlug(
                          checked ? collection.slug : undefined,
                        )
                      }
                    />
                    <span className="flex-1 truncate">{collection.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({collection.count})
                    </span>
                  </label>
                ))}
              </div>

              {/* Load More Button */}
              {hasMoreCollections && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMoreCollections}
                  className="w-full text-xs h-8"
                >
                  Load More (
                  {filteredCollections.length - visibleCollectionsCount}{" "}
                  remaining)
                </Button>
              )}
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Price Range */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium">
          Price Range
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {PRICE_RANGES.map((range) => (
            <label
              key={range.label}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                checked={
                  (filters.minPrice ?? null) === range.min &&
                  (filters.maxPrice ?? null) === range.max
                }
                onCheckedChange={(checked) =>
                  checked
                    ? handlePriceRange(range.min, range.max)
                    : handlePriceRange(null, null)
                }
              />
              <span>{range.label}</span>
              {facets?.priceRanges.find((f) => f.value === range.label) && (
                <span className="text-muted-foreground ml-auto">
                  (
                  {
                    facets.priceRanges.find((f) => f.value === range.label)
                      ?.count
                  }
                  )
                </span>
              )}
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Other Filters */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium">
          Other Filters
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={filters.inStock === true}
              onCheckedChange={(checked) =>
                updateFilter("inStock", checked ? true : undefined)
              }
            />
            <span>In Stock Only</span>
          </label>

          {facets?.isFeatured && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={filters.isFeatured === true}
                onCheckedChange={(checked) =>
                  updateFilter("isFeatured", checked ? true : undefined)
                }
              />
              <span>Featured</span>
              <span className="text-muted-foreground ml-auto">
                ({facets.isFeatured.count})
              </span>
            </label>
          )}

          {facets?.isNewArrival && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={filters.isNewArrival === true}
                onCheckedChange={(checked) =>
                  updateFilter("isNewArrival", checked ? true : undefined)
                }
              />
              <span>New Arrivals</span>
              <span className="text-muted-foreground ml-auto">
                ({facets.isNewArrival.count})
              </span>
            </label>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="w-full"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen py-8 md:py-12 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          {query ? `Results for "${query}"` : "All Products"}
        </h1>
        {results && (
          <p className="text-muted-foreground">
            {totalCount} {totalCount === 1 ? "product" : "products"} found
          </p>
        )}
      </div>

      {/* Search and Sort Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Sort & Filter Controls */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Mobile Filter Button */}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort Dropdown */}
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SearchSortBy)}
            >
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="popularity">Popularity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {query && (
              <Badge variant="secondary" className="gap-1">
                Search: {query}
                <button
                  onClick={() => {
                    setSearchInput("");
                    setQuery("");
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCollectionSlug && allCollections.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                {
                  allCollections.find((c) => c.slug === selectedCollectionSlug)
                    ?.name
                }
                <button onClick={() => setSelectedCollectionSlug(undefined)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <Badge variant="secondary" className="gap-1">
                {filters.minPrice && filters.maxPrice
                  ? `₹${filters.minPrice} - ₹${filters.maxPrice}`
                  : filters.minPrice
                    ? `Over ₹${filters.minPrice}`
                    : `Under ₹${filters.maxPrice}`}
                <button onClick={() => handlePriceRange(null, null)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.inStock && (
              <Badge variant="secondary" className="gap-1">
                In Stock
                <button onClick={() => updateFilter("inStock", undefined)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.isFeatured && (
              <Badge variant="secondary" className="gap-1">
                Featured
                <button onClick={() => updateFilter("isFeatured", undefined)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.isNewArrival && (
              <Badge variant="secondary" className="gap-1">
                New Arrivals
                <button onClick={() => updateFilter("isNewArrival", undefined)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              {activeFilterCount > 0 && (
                <Badge variant="secondary">{activeFilterCount}</Badge>
              )}
            </div>
            {facetsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <FilterContent />
            )}
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1">
          {loading && !results ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <Button onClick={() => setQuery(query)} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : results?.items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No products found matching your criteria.
              </p>
              {activeFilterCount > 0 && (
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Product Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {results?.items.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      description: product.description,
                      price: product.price,
                      image_url: product.imageUrl,
                      stock: product.stock,
                      discount_percentage: product.discountPercentage,
                      is_out_of_stock: product.isOutOfStock,
                    }}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    variant="outline"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
