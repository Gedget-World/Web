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
    image_url?: string | null;
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

  const selectedCollection = selectedCollectionSlug
    ? allCollections.find((c) => c.slug === selectedCollectionSlug)
    : undefined;

  const selectedCollectionImageUrl = selectedCollection?.image_url?.trim();

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
  const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="space-y-4 sm:space-y-6">
      {/* Collections */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-xs sm:text-sm font-medium py-1">
          <span className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            Collections
          </span>
          <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 sm:pt-3 space-y-2 sm:space-y-3">
          {/* Collection Search */}
          <div className="relative">
            <Search className="absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search collections..."
              value={collectionSearchQuery}
              onChange={(e) => setCollectionSearchQuery(e.target.value)}
              className="pl-7 sm:pl-8 h-8 sm:h-9 text-xs sm:text-sm"
            />
          </div>

          {/* Collections List */}
          {collectionsLoading ? (
            <div className="flex items-center justify-center py-3 sm:py-4">
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            </div>
          ) : filteredCollections.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground py-2">
              {collectionSearchQuery
                ? "No collections found"
                : "No collections available"}
            </p>
          ) : (
            <>
              <div className="space-y-1 sm:space-y-2 max-h-40 sm:max-h-48 overflow-y-auto overflow-x-hidden">
                {displayedCollections.map((collection) => (
                  <label
                    key={collection.id}
                    className="flex items-center gap-2 min-w-0 text-sm sm:text-base cursor-pointer hover:bg-accent/50 rounded px-1.5 sm:px-2 py-1.5 sm:py-1 -mx-1 transition-colors"
                  >
                    <Checkbox
                      checked={selectedCollectionSlug === collection.slug}
                      onCheckedChange={(checked) =>
                        setSelectedCollectionSlug(
                          checked ? collection.slug : undefined,
                        )
                      }
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0"
                    />
                    <span className="flex-1 min-w-0 truncate">
                      {collection.name}
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
                  className="w-full text-[10px] sm:text-xs h-7 sm:h-8"
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
        <CollapsibleTrigger className="flex items-center justify-between w-full text-xs sm:text-sm font-medium py-1">
          <span className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            Price Range
          </span>
          <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-1 sm:space-y-2">
          {PRICE_RANGES.map((range) => (
            <label
              key={range.label}
              className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer hover:bg-accent/50 rounded px-1.5 sm:px-2 py-1.5 sm:py-1 -mx-1 transition-colors"
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
                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
              />
              <span className="flex-1">{range.label}</span>
              {facets?.priceRanges.find((f) => f.value === range.label) && (
                <span className="text-muted-foreground text-[10px] sm:text-xs shrink-0">
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
        <CollapsibleTrigger className="flex items-center justify-between w-full text-xs sm:text-sm font-medium py-1">
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            Other Filters
          </span>
          <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-1 sm:space-y-2">
          <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer hover:bg-accent/50 rounded px-1.5 sm:px-2 py-1.5 sm:py-1 -mx-1 transition-colors">
            <Checkbox
              checked={filters.inStock === true}
              onCheckedChange={(checked) =>
                updateFilter("inStock", checked ? true : undefined)
              }
              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
            />
            <span>In Stock Only</span>
          </label>

          <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer hover:bg-accent/50 rounded px-1.5 sm:px-2 py-1.5 sm:py-1 -mx-1 transition-colors">
            <Checkbox
              checked={filters.isFeatured === true}
              onCheckedChange={(checked) =>
                updateFilter("isFeatured", checked ? true : undefined)
              }
              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
            />
            <span className="flex-1">Featured</span>
          </label>

          <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer hover:bg-accent/50 rounded px-1.5 sm:px-2 py-1.5 sm:py-1 -mx-1 transition-colors">
            <Checkbox
              checked={filters.isNewArrival === true}
              onCheckedChange={(checked) =>
                updateFilter("isNewArrival", checked ? true : undefined)
              }
              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
            />
            <span className="flex-1">New Arrivals</span>
          </label>
        </CollapsibleContent>
      </Collapsible>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            handleClearFilters();
            if (isMobile) setFiltersOpen(false);
          }}
          className="w-full text-xs sm:text-sm h-8 sm:h-9"
        >
          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen">
      <div className="py-4 sm:py-6 md:py-10 px-3 sm:px-4 md:px-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 overflow-x-auto">
          <Link
            href="/"
            className="hover:text-foreground transition-colors flex items-center gap-1 shrink-0"
          >
            <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
          <span className="text-foreground font-medium shrink-0">Products</span>
          {selectedCollectionSlug && allCollections.length > 0 && (
            <>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
              <span className="text-foreground font-medium truncate max-w-[120px] sm:max-w-none">
                {selectedCollection?.name}
              </span>
            </>
          )}
        </nav>

        {/* Page Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                <div
                  className={`p-1.5 sm:p-2 ${
                    selectedCollectionImageUrl ? "" : "bg-primary/10 rounded-lg"
                  }`}
                >
                  {selectedCollectionImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedCollectionImageUrl}
                      alt={`${selectedCollection?.name || "Collection"} thumbnail`}
                      className="w-5 h-5 sm:w-8 sm:h-8 object-cover rounded"
                    />
                  ) : (
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  )}
                </div>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground line-clamp-1">
                  {query
                    ? `Results for "${query}"`
                    : selectedCollectionSlug && allCollections.length > 0
                      ? selectedCollection?.name || "All Products"
                      : "All Products"}
                </h1>
              </div>
              {results && (
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                  <Tag className="w-3 h-3 sm:w-4 sm:h-4" />
                  Showing {results.items.length} of {totalCount}{" "}
                  {totalCount === 1 ? "product" : "products"}
                </p>
              )}
            </div>

            {/* Quick Filter Badges */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Badge
                variant={filters.isNewArrival ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10 transition-colors text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1"
                onClick={() =>
                  updateFilter(
                    "isNewArrival",
                    filters.isNewArrival ? undefined : true,
                  )
                }
              >
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                New Arrivals
              </Badge>
              <Badge
                variant={filters.inStock ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10 transition-colors text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1"
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
        <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Sort & Filter Controls */}
            <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-between sm:justify-end">
              {/* Mobile Filter Button */}
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden h-8 sm:h-9 text-xs sm:text-sm px-2.5 sm:px-3"
                  >
                    <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs px-1.5 h-4 sm:h-5"
                      >
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-full sm:w-80 px-4 sm:px-6 overflow-x-hidden"
                >
                  <SheetHeader className="pb-3 sm:pb-4 border-b">
                    <SheetTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[10px] sm:text-xs"
                        >
                          {activeFilterCount} active
                        </Badge>
                      )}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 sm:mt-6 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-100px)] pb-6">
                    <FilterContent isMobile={true} />
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
                <SelectTrigger className="w-[130px] sm:w-[180px] h-8 sm:h-9 text-xs sm:text-sm">
                  <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance" className="text-xs sm:text-sm">
                    Relevance
                  </SelectItem>
                  <SelectItem value="newest" className="text-xs sm:text-sm">
                    Newest
                  </SelectItem>
                  <SelectItem value="price_asc" className="text-xs sm:text-sm">
                    Price: Low to High
                  </SelectItem>
                  <SelectItem value="price_desc" className="text-xs sm:text-sm">
                    Price: High to Low
                  </SelectItem>
                  <SelectItem value="popularity" className="text-xs sm:text-sm">
                    Popularity
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-sm text-muted-foreground">
                Active:
              </span>
              {query && (
                <Badge
                  variant="secondary"
                  className="gap-0.5 sm:gap-1 pl-1.5 sm:pl-2 text-[10px] sm:text-xs h-6 sm:h-7"
                >
                  <Search className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="max-w-[60px] sm:max-w-none truncate">
                    {query}
                  </span>
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setQuery("");
                    }}
                    className="ml-0.5 sm:ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </button>
                </Badge>
              )}
              {selectedCollectionSlug && allCollections.length > 0 && (
                <Badge
                  variant="secondary"
                  className="gap-0.5 sm:gap-1 pl-1.5 sm:pl-2 text-[10px] sm:text-xs h-6 sm:h-7"
                >
                  {selectedCollectionImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedCollectionImageUrl}
                      alt={`${selectedCollection?.name || "Collection"} thumbnail`}
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 object-cover rounded"
                    />
                  ) : (
                    <Package className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  )}
                  <span className="max-w-[60px] sm:max-w-none truncate">
                    {selectedCollection?.name}
                  </span>
                  <button
                    onClick={() => setSelectedCollectionSlug(undefined)}
                    className="ml-0.5 sm:ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </button>
                </Badge>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <Badge
                  variant="secondary"
                  className="gap-0.5 sm:gap-1 pl-1.5 sm:pl-2 text-[10px] sm:text-xs h-6 sm:h-7"
                >
                  <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {filters.minPrice && filters.maxPrice
                    ? `₹${filters.minPrice} - ₹${filters.maxPrice}`
                    : filters.minPrice
                      ? `Over ₹${filters.minPrice}`
                      : `Under ₹${filters.maxPrice}`}
                  <button
                    onClick={() => handlePriceRange(null, null)}
                    className="ml-0.5 sm:ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </button>
                </Badge>
              )}
              {filters.inStock && (
                <Badge
                  variant="secondary"
                  className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-6 sm:h-7"
                >
                  In Stock
                  <button
                    onClick={() => updateFilter("inStock", undefined)}
                    className="ml-0.5 sm:ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </button>
                </Badge>
              )}
              {filters.isFeatured && (
                <Badge
                  variant="secondary"
                  className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-6 sm:h-7"
                >
                  Featured
                  <button
                    onClick={() => updateFilter("isFeatured", undefined)}
                    className="ml-0.5 sm:ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </button>
                </Badge>
              )}
              {filters.isNewArrival && (
                <Badge
                  variant="secondary"
                  className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs h-6 sm:h-7"
                >
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  New
                  <button
                    onClick={() => updateFilter("isNewArrival", undefined)}
                    className="ml-0.5 sm:ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-[10px] sm:text-xs h-6 sm:h-7 px-1.5 sm:px-2 text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-4 sm:gap-6 lg:gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-60 xl:w-64 shrink-0">
            <div className="sticky top-24 bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </h2>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-4">
                {facetsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
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
              <div className="flex flex-col items-center justify-center py-10 sm:py-16">
                <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  Loading products...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-10 sm:py-16 bg-red-50 rounded-xl border border-red-100 px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <X className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
                </div>
                <p className="text-sm sm:text-base text-red-600 font-medium mb-1.5 sm:mb-2">
                  Something went wrong
                </p>
                <p className="text-xs sm:text-sm text-red-500 mb-3 sm:mb-4">
                  {error}
                </p>
                <Button
                  onClick={() => setQuery(query)}
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  Try Again
                </Button>
              </div>
            ) : results?.items.length === 0 ? (
              <div className="text-center py-10 sm:py-16 bg-gray-50 rounded-xl border px-4">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Package className="w-7 h-7 sm:w-10 sm:h-10 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  No products found
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
                  We couldn't find any products matching your criteria. Try
                  adjusting your filters or search terms.
                </p>
                {activeFilterCount > 0 && (
                  <Button
                    onClick={handleClearFilters}
                    variant="outline"
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
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
                  <div className="flex justify-center mt-6 sm:mt-10">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      variant="outline"
                      size="default"
                      className="min-w-40 sm:min-w-[200px] h-9 sm:h-10 text-xs sm:text-sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More Products
                          <ChevronDown className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Results Summary */}
                {!hasMore && results && results.items.length > 0 && (
                  <div className="text-center mt-6 sm:mt-10 py-4 sm:py-6 border-t">
                    <p className="text-xs sm:text-sm text-muted-foreground">
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
