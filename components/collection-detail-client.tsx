"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  average_rating: number;
  review_count: number;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface CollectionDetailClientProps {
  collection: Collection;
  products: Product[];
}

const ITEMS_PER_PAGE = 12;

export function CollectionDetailClient({
  collection,
  products,
}: CollectionDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const maxPrice = Math.max(...products.map((p) => p.price), 1000);

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [priceRange, setPriceRange] = useState([
    Number(searchParams.get("minPrice")) || 0,
    Number(searchParams.get("maxPrice")) || maxPrice,
  ]);
  const [minRating, setMinRating] = useState(
    Number(searchParams.get("rating")) || 0
  );
  const [inStockOnly, setInStockOnly] = useState(
    searchParams.get("inStock") === "true"
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1
  );

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
    if (priceRange[1] < maxPrice)
      params.set("maxPrice", priceRange[1].toString());
    if (minRating > 0) params.set("rating", minRating.toString());
    if (inStockOnly) params.set("inStock", "true");
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (currentPage > 1) params.set("page", currentPage.toString());

    const queryString = params.toString();
    const newUrl = queryString
      ? `/collections/${collection.slug}?${queryString}`
      : `/collections/${collection.slug}`;

    router.push(newUrl, { scroll: false });
  }, [
    searchQuery,
    priceRange,
    minRating,
    inStockOnly,
    sortBy,
    currentPage,
    router,
    collection.slug,
    maxPrice,
  ]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
      );
    }

    // Price filter
    filtered = filtered.filter(
      (product) =>
        product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter(
        (product) => product.average_rating >= minRating
      );
    }

    // Stock filter
    if (inStockOnly) {
      filtered = filtered.filter((product) => product.stock > 0);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "rating":
          return b.average_rating - a.average_rating;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "newest":
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, priceRange, minRating, inStockOnly, sortBy]);

  const totalPages = Math.ceil(
    filteredAndSortedProducts.length / ITEMS_PER_PAGE
  );

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedProducts.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredAndSortedProducts, currentPage]);

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Price Range</Label>
        <div className="space-y-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => {
              setPriceRange(value);
              handleFilterChange();
            }}
            max={maxPrice}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-slate-600">
            <span>${priceRange[0]}</span>
            <span>${priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Minimum Rating</Label>
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
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="2">2+ Stars</SelectItem>
            <SelectItem value="1">1+ Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stock Filter */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="inStock"
          checked={inStockOnly}
          onCheckedChange={(checked) => {
            setInStockOnly(checked as boolean);
            handleFilterChange();
          }}
        />
        <Label htmlFor="inStock" className="text-sm cursor-pointer">
          In Stock Only
        </Label>
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          {collection.name}
        </h1>
        <p className="text-lg text-slate-600">{collection.description}</p>
      </div>

      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
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

          {/* Mobile Filters */}
          <Sheet>
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
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Refine your product search</SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <FiltersContent />
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Filters Button */}
          <Button
            variant="outline"
            className="hidden md:flex relative bg-transparent"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Filters Panel */}
        <div className="hidden md:block bg-slate-50 rounded-lg p-6">
          <FiltersContent />
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              Active Filters:
            </span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 pl-3 pr-1 py-1">
                Search: {searchQuery}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    handleFilterChange();
                  }}
                  className="ml-1 hover:bg-slate-300 rounded-full p-1 transition-colors"
                  aria-label="Remove search filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
              <Badge variant="secondary" className="gap-1 pl-3 pr-1 py-1">
                Price: ${priceRange[0]} - ${priceRange[1]}
                <button
                  onClick={() => {
                    setPriceRange([0, maxPrice]);
                    handleFilterChange();
                  }}
                  className="ml-1 hover:bg-slate-300 rounded-full p-1 transition-colors"
                  aria-label="Remove price filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {minRating > 0 && (
              <Badge variant="secondary" className="gap-1 pl-3 pr-1 py-1">
                Rating: {minRating}+ Stars
                <button
                  onClick={() => {
                    setMinRating(0);
                    handleFilterChange();
                  }}
                  className="ml-1 hover:bg-slate-300 rounded-full p-1 transition-colors"
                  aria-label="Remove rating filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {inStockOnly && (
              <Badge variant="secondary" className="gap-1 pl-3 pr-1 py-1">
                In Stock Only
                <button
                  onClick={() => {
                    setInStockOnly(false);
                    handleFilterChange();
                  }}
                  className="ml-1 hover:bg-slate-300 rounded-full p-1 transition-colors"
                  aria-label="Remove stock filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setPriceRange([0, maxPrice]);
                setMinRating(0);
                setInStockOnly(false);
                setSortBy("newest");
                handleFilterChange();
              }}
              className="h-7 text-xs"
            >
              Clear All
            </Button>
          </div>
        )}
      </div>

      <div className="mb-4 text-sm text-slate-600">
        Showing {paginatedProducts.length} of {filteredAndSortedProducts.length}{" "}
        products
      </div>

      {paginatedProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600">
            No products found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className="w-10"
                  >
                    {page}
                  </Button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="px-2">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}
