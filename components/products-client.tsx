"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  discount_percentage: number | null;
  average_rating: number;
  review_count: number;
  collections?: { name: string; slug: string };
}

interface Collection {
  id: string;
  name: string;
  slug: string;
}

interface ProductsClientProps {
  initialProducts: Product[];
  collections: Collection[];
}

const ITEMS_PER_PAGE = 12;

export function ProductsClient({
  initialProducts,
  collections,
}: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [selectedCollection, setSelectedCollection] = useState<string>(
    searchParams.get("collection") || "all",
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get("minPrice")) || 0,
    Number(searchParams.get("maxPrice")) || 1000,
  ]);
  const [minRating, setMinRating] = useState<number>(
    Number(searchParams.get("rating")) || 0,
  );
  const [inStockOnly, setInStockOnly] = useState(
    searchParams.get("inStock") === "true",
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get("sort") || "newest",
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1,
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const maxPrice = useMemo(() => {
    return Math.max(...initialProducts.map((p) => p.price), 1000);
  }, [initialProducts]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.set("search", searchQuery);
    if (selectedCollection !== "all")
      params.set("collection", selectedCollection);
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
    if (priceRange[1] < maxPrice)
      params.set("maxPrice", priceRange[1].toString());
    if (minRating > 0) params.set("rating", minRating.toString());
    if (inStockOnly) params.set("inStock", "true");
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (currentPage > 1) params.set("page", currentPage.toString());

    const queryString = params.toString();
    const newUrl = queryString ? `/products?${queryString}` : "/products";

    router.push(newUrl, { scroll: false });
  }, [
    searchQuery,
    selectedCollection,
    priceRange,
    minRating,
    inStockOnly,
    sortBy,
    currentPage,
    router,
    maxPrice,
  ]);

  const filteredProducts = useMemo(() => {
    const filtered = initialProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCollection =
        selectedCollection === "all" ||
        product.collections?.slug === selectedCollection;

      const matchesPrice =
        product.price >= priceRange[0] && product.price <= priceRange[1];

      const matchesRating = product.average_rating >= minRating;

      const matchesStock = !inStockOnly || product.stock > 0;

      return (
        matchesSearch &&
        matchesCollection &&
        matchesPrice &&
        matchesRating &&
        matchesStock
      );
    });

    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => b.average_rating - a.average_rating);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        break;
    }

    return filtered;
  }, [
    initialProducts,
    searchQuery,
    selectedCollection,
    priceRange,
    minRating,
    inStockOnly,
    sortBy,
  ]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCollection("all");
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setInStockOnly(false);
    setSortBy("newest");
    setCurrentPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedCollection !== "all") count++;
    if (priceRange[0] > 0 || priceRange[1] < maxPrice) count++;
    if (minRating > 0) count++;
    if (inStockOnly) count++;
    return count;
  }, [
    searchQuery,
    selectedCollection,
    priceRange,
    minRating,
    inStockOnly,
    maxPrice,
  ]);

  const removeSearchFilter = () => {
    setSearchQuery("");
    handleFilterChange();
  };

  const removeCollectionFilter = () => {
    setSelectedCollection("all");
    handleFilterChange();
  };

  const removePriceFilter = () => {
    setPriceRange([0, maxPrice]);
    handleFilterChange();
  };

  const removeRatingFilter = () => {
    setMinRating(0);
    handleFilterChange();
  };

  const removeStockFilter = () => {
    setInStockOnly(false);
    handleFilterChange();
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Collection</Label>
        <Select
          value={selectedCollection}
          onValueChange={(value) => {
            setSelectedCollection(value);
            handleFilterChange();
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Collections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {collections.map((collection) => (
              <SelectItem key={collection.id} value={collection.slug}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>
          Price Range: ${priceRange[0]} - ${priceRange[1]}
        </Label>
        <Slider
          min={0}
          max={maxPrice}
          step={10}
          value={priceRange}
          onValueChange={(value) => {
            setPriceRange(value as [number, number]);
            handleFilterChange();
          }}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>Minimum Rating</Label>
        <Select
          value={minRating.toString()}
          onValueChange={(value) => {
            setMinRating(Number(value));
            handleFilterChange();
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All Ratings</SelectItem>
            <SelectItem value="1">1+ Stars</SelectItem>
            <SelectItem value="2">2+ Stars</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="inStock"
          checked={inStockOnly}
          onChange={(e) => {
            setInStockOnly(e.target.checked);
            handleFilterChange();
          }}
          className="h-4 w-4 rounded border-slate-300"
        />
        <Label htmlFor="inStock" className="cursor-pointer">
          In Stock Only
        </Label>
      </div>

      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full bg-transparent"
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen py-12 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">All Products</h1>
        <p className="text-lg text-slate-600">Browse our complete collection</p>
      </div>

      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleFilterChange();
              }}
              className="pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="name">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="md:hidden relative bg-transparent"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Refine your product search</SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-600">Active filters:</span>
            {searchQuery && (
              <Badge
                variant="secondary"
                className="gap-1.5 pr-1 hover:bg-slate-200 transition-colors"
              >
                <span>Search: {searchQuery}</span>
                <button
                  onClick={removeSearchFilter}
                  className="ml-1 rounded-sm hover:bg-slate-300 p-0.5 transition-colors"
                  aria-label="Remove search filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCollection !== "all" && (
              <Badge
                variant="secondary"
                className="gap-1.5 pr-1 hover:bg-slate-200 transition-colors"
              >
                <span>
                  Collection:{" "}
                  {collections.find((c) => c.slug === selectedCollection)?.name}
                </span>
                <button
                  onClick={removeCollectionFilter}
                  className="ml-1 rounded-sm hover:bg-slate-300 p-0.5 transition-colors"
                  aria-label="Remove collection filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
              <Badge
                variant="secondary"
                className="gap-1.5 pr-1 hover:bg-slate-200 transition-colors"
              >
                <span>
                  Price: ${priceRange[0]} - ${priceRange[1]}
                </span>
                <button
                  onClick={removePriceFilter}
                  className="ml-1 rounded-sm hover:bg-slate-300 p-0.5 transition-colors"
                  aria-label="Remove price filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {minRating > 0 && (
              <Badge
                variant="secondary"
                className="gap-1.5 pr-1 hover:bg-slate-200 transition-colors"
              >
                <span>{minRating}+ Stars</span>
                <button
                  onClick={removeRatingFilter}
                  className="ml-1 rounded-sm hover:bg-slate-300 p-0.5 transition-colors"
                  aria-label="Remove rating filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {inStockOnly && (
              <Badge
                variant="secondary"
                className="gap-1.5 pr-1 hover:bg-slate-200 transition-colors"
              >
                <span>In Stock</span>
                <button
                  onClick={removeStockFilter}
                  className="ml-1 rounded-sm hover:bg-slate-300 p-0.5 transition-colors"
                  aria-label="Remove stock filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-8">
        <aside className="hidden md:block w-64">
          <div className="sticky top-4 bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Filters</h2>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">{activeFiltersCount}</Badge>
              )}
            </div>
            <FilterContent />
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-4 text-sm text-slate-600">
            Showing {paginatedProducts.length} of {filteredProducts.length}{" "}
            products
          </div>

          {paginatedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg mb-4">No products found</p>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-4 lg:gap-6 gap-2 mb-8">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              onClick={() => setCurrentPage(page)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2">
                              ...
                            </span>
                          );
                        }
                        return null;
                      },
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
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
