"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Filter,
  SlidersHorizontal,
  ChevronDown,
  X,
  Loader2,
  Search,
  Grid3X3,
  Grid2X2,
  LayoutGrid,
  Sparkles,
  ChevronRight,
  Package,
  Tag,
  Home,
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
  const [gridSize, setGridSize] = useState<"small" | "medium" | "large">(
    "medium",
  );

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
    <main className="min-h-screen">
      <div className="py-6 md:py-10 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link
            href="/"
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">Products</span>
          {selectedCollectionSlug && allCollections.length > 0 && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">
                {
                  allCollections.find((c) => c.slug === selectedCollectionSlug)
                    ?.name
                }
              </span>
            </>
          )}
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {query
                    ? `Results for "${query}"`
                    : selectedCollectionSlug && allCollections.length > 0
                      ? allCollections.find(
                          (c) => c.slug === selectedCollectionSlug,
                        )?.name || "All Products"
                      : "All Products"}
                </h1>
              </div>
              {results && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Showing {results.items.length} of {totalCount}{" "}
                  {totalCount === 1 ? "product" : "products"}
                </p>
              )}
            </div>

            {/* Quick Filter Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={filters.isNewArrival ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() =>
                  updateFilter(
                    "isNewArrival",
                    filters.isNewArrival ? undefined : true,
                  )
                }
              >
                <Sparkles className="w-3 h-3 mr-1" />
                New Arrivals
              </Badge>
              <Badge
                variant={filters.inStock ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() =>
                  updateFilter("inStock", filters.inStock ? undefined : true)
                }
              >
                In Stock
              </Badge>
            </div>
          </div>
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
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Filters
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* View Mode Toggle (Desktop) */}
              <div className="hidden md:flex items-center border rounded-lg p-1">
                <Button
                  variant={gridSize === "small" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setGridSize("small")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={gridSize === "medium" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setGridSize("medium")}
                >
                  <Grid2X2 className="h-4 w-4" />
                </Button>
                <Button
                  variant={gridSize === "large" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setGridSize("large")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>

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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {query && (
                <Badge variant="secondary" className="gap-1 pl-2">
                  <Search className="w-3 h-3" />
                  {query}
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setQuery("");
                    }}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedCollectionSlug && allCollections.length > 0 && (
                <Badge variant="secondary" className="gap-1 pl-2">
                  <Package className="w-3 h-3" />
                  {
                    allCollections.find(
                      (c) => c.slug === selectedCollectionSlug,
                    )?.name
                  }
                  <button
                    onClick={() => setSelectedCollectionSlug(undefined)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <Badge variant="secondary" className="gap-1 pl-2">
                  <Tag className="w-3 h-3" />
                  {filters.minPrice && filters.maxPrice
                    ? `₹${filters.minPrice} - ₹${filters.maxPrice}`
                    : filters.minPrice
                      ? `Over ₹${filters.minPrice}`
                      : `Under ₹${filters.maxPrice}`}
                  <button
                    onClick={() => handlePriceRange(null, null)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.inStock && (
                <Badge variant="secondary" className="gap-1">
                  In Stock
                  <button
                    onClick={() => updateFilter("inStock", undefined)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.isFeatured && (
                <Badge variant="secondary" className="gap-1">
                  Featured
                  <button
                    onClick={() => updateFilter("isFeatured", undefined)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.isNewArrival && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  New Arrivals
                  <button
                    onClick={() => updateFilter("isNewArrival", undefined)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs h-7 text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-5 py-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </h2>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="rounded-full">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-5">
                {facetsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <FilterContent />
                )}
              </div>
            </div>
          </aside>

          {/* Results Grid */}
          <div className="flex-1">
            {loading && !results ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading products...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-red-50 rounded-xl border border-red-100">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-red-600 font-medium mb-2">
                  Something went wrong
                </p>
                <p className="text-red-500 text-sm mb-4">{error}</p>
                <Button onClick={() => setQuery(query)} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : results?.items.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  We couldn't find any products matching your criteria. Try
                  adjusting your filters or search terms.
                </p>
                {activeFilterCount > 0 && (
                  <Button onClick={handleClearFilters} variant="outline">
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Product Grid */}
                <div
                  className={`grid gap-3 md:gap-5 ${
                    gridSize === "small"
                      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                      : gridSize === "large"
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                        : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  }`}
                >
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
                  <div className="flex justify-center mt-10">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      variant="outline"
                      size="lg"
                      className="min-w-[200px]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More Products
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Results Summary */}
                {!hasMore && results && results.items.length > 0 && (
                  <div className="text-center mt-10 py-6 border-t">
                    <p className="text-sm text-muted-foreground">
                      You've viewed all {totalCount} products
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
