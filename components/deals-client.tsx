"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ProductCard } from "@/components/product-card";

const ITEMS_PER_PAGE = 12;

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discount_percentage: number;
  image_url: string | null;
  stock: number;
  is_out_of_stock: boolean;
  collections: {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    parent: { name: string; slug: string }[] | null;
  } | null;
};

type Collection = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  parent: { name: string; slug: string }[] | null;
};

export function DealsClient({
  initialProducts,
  collections,
}: {
  initialProducts: Product[];
  collections: Collection[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const [selectedCollection, setSelectedCollection] = useState(
    searchParams.get("collection") || "all",
  );
  const [minDiscount, setMinDiscount] = useState(
    Number(searchParams.get("minDiscount")) || 0,
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "discount-desc",
  );
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1,
  );

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCollection !== "all")
      params.set("collection", selectedCollection);
    if (minDiscount > 0) params.set("minDiscount", minDiscount.toString());
    if (sortBy !== "discount-desc") params.set("sort", sortBy);
    if (currentPage > 1) params.set("page", currentPage.toString());

    router.push(`/deals?${params.toString()}`, { scroll: false });
  }, [
    searchQuery,
    selectedCollection,
    minDiscount,
    sortBy,
    currentPage,
    router,
  ]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const filtered = initialProducts.filter((product) => {
      const matchesSearch =
        searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Match collection directly OR if the product's collection is a child of the selected collection
      const matchesCollection =
        selectedCollection === "all" ||
        product.collections?.id === selectedCollection ||
        (product.collections?.parent &&
          product.collections.parent[0]?.slug ===
            collections.find((c) => c.id === selectedCollection)?.slug);

      const matchesDiscount = product.discount_percentage >= minDiscount;

      return matchesSearch && matchesCollection && matchesDiscount;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "discount-desc":
          return b.discount_percentage - a.discount_percentage;
        case "discount-asc":
          return a.discount_percentage - b.discount_percentage;
        case "price-asc":
          return (
            a.price * (1 - a.discount_percentage / 100) -
            b.price * (1 - b.discount_percentage / 100)
          );
        case "price-desc":
          return (
            b.price * (1 - b.discount_percentage / 100) -
            a.price * (1 - a.discount_percentage / 100)
          );
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [initialProducts, searchQuery, selectedCollection, minDiscount, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCollection("all");
    setMinDiscount(0);
    setSortBy("discount-desc");
    setCurrentPage(1);
  };

  const activeFiltersCount =
    (searchQuery ? 1 : 0) +
    (selectedCollection !== "all" ? 1 : 0) +
    (minDiscount > 0 ? 1 : 0);

  // Organize collections: parent collections first, then children grouped under parents
  const parentCollections = collections.filter((c) => !c.parent_id);
  const childCollections = collections.filter((c) => c.parent_id);

  const orderedCollections = parentCollections.flatMap((parent) => {
    const children = childCollections.filter(
      (child) => child.parent && child.parent[0]?.slug === parent.slug,
    );
    return [parent, ...children];
  });

  const includedIds = new Set(orderedCollections.map((c) => c.id));
  const orphanedChildren = childCollections.filter(
    (c) => !includedIds.has(c.id),
  );
  const finalCollections = [...orderedCollections, ...orphanedChildren];

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium mb-3 block">Collection</Label>
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
            {finalCollections.map((collection) => (
              <SelectItem key={collection.id} value={collection.id}>
                {collection.parent_id
                  ? `↳ ${collection.name}`
                  : collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">
          Minimum Discount: {minDiscount}%
        </Label>
        <Slider
          value={[minDiscount]}
          onValueChange={(value) => {
            setMinDiscount(value[0]);
            handleFilterChange();
          }}
          max={50}
          step={5}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>0%</span>
          <span>50%</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-8 px-4 md:px-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-balance">Deals & Offers</h1>
        <p className="text-muted-foreground text-pretty">
          Save big on your favorite fashion items
        </p>
      </div>

      {/* Search and Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleFilterChange();
            }}
            className="pl-9"
          />
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="discount-desc">Highest Discount</SelectItem>
            <SelectItem value="discount-asc">Lowest Discount</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name">Name: A to Z</SelectItem>
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-transparent"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 hover:bg-secondary/80 transition-colors"
            >
              Search: {searchQuery}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-secondary-foreground/20 rounded-full"
                onClick={() => {
                  setSearchQuery("");
                  handleFilterChange();
                }}
                aria-label="Remove search filter"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {selectedCollection !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 hover:bg-secondary/80 transition-colors"
            >
              {collections.find((c) => c.id === selectedCollection)?.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-secondary-foreground/20 rounded-full"
                onClick={() => {
                  setSelectedCollection("all");
                  handleFilterChange();
                }}
                aria-label="Remove collection filter"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {minDiscount > 0 && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 hover:bg-secondary/80 transition-colors"
            >
              Min Discount: {minDiscount}%
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-secondary-foreground/20 rounded-full"
                onClick={() => {
                  setMinDiscount(0);
                  handleFilterChange();
                }}
                aria-label="Remove discount filter"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-muted-foreground mb-4">
        Showing {paginatedProducts.length} of {filteredProducts.length} deals
      </p>

      {/* Products Grid */}
      {paginatedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {paginatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No deals found matching your criteria.
          </p>
          <Button variant="link" onClick={clearAllFilters} className="mt-2">
            Clear all filters
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
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
                    size="sm"
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
    </div>
  );
}
