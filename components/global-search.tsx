"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface SearchResult {
  type: "product" | "collection";
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  price?: number;
  description?: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<
    SearchResult[]
  >([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  // Fetch recommended products when dialog opens
  const fetchRecommendedProducts = useCallback(async () => {
    try {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, slug, image_url, price, description")
        .eq("is_new_arrival", true)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);

      const productResults: SearchResult[] =
        products?.map((p) => ({
          type: "product" as const,
          id: p.id,
          name: p.name,
          slug: p.slug,
          image_url: p.image_url,
          price: p.price,
          description: p.description,
        })) || [];

      setRecommendedProducts(productResults);
    } catch (error) {
      console.error("Error fetching recommended products:", error);
    }
  }, [supabase]);

  // Fetch recommended products when dialog opens
  useEffect(() => {
    if (open && recommendedProducts.length === 0) {
      fetchRecommendedProducts();
    }
  }, [open, fetchRecommendedProducts, recommendedProducts.length]);

  const searchAll = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // Search products
        const { data: products } = await supabase
          .from("products")
          .select("id, name, slug, image_url, price, description")
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(5);

        // Search collections
        const { data: collections } = await supabase
          .from("collections")
          .select("id, name, slug, image_url, description")
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(5);

        const productResults: SearchResult[] =
          products?.map((p) => ({
            type: "product" as const,
            id: p.id,
            name: p.name,
            slug: p.slug,
            image_url: p.image_url,
            price: p.price,
            description: p.description,
          })) || [];

        const collectionResults: SearchResult[] =
          collections?.map((c) => ({
            type: "collection" as const,
            id: c.id,
            name: c.name,
            slug: c.slug,
            image_url: c.image_url,
            description: c.description,
          })) || [];

        setResults([...productResults, ...collectionResults]);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      searchAll(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchAll]);

  const handleResultClick = (result: SearchResult) => {
    const path =
      result.type === "product"
        ? `/products/${result.slug}`
        : `/collections/${result.slug}`;
    router.push(path);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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
          Search products, collections...
        </span>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="sr-only">Search</DialogTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products ..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-9 h-12 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            </div>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto px-4 pb-4">
            {loading && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}

            {/* Show recommended products when no query */}
            {!loading && !query && recommendedProducts.length > 0 && (
              <div className="space-y-4 mt-4">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    New Arrivals
                  </h3>
                  <div className="space-y-1">
                    {recommendedProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleResultClick(product)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        {product.image_url && (
                          <div className="relative h-12 w-12 shrink-0 rounded overflow-hidden bg-muted">
                            <Image
                              src={product.image_url || "/placeholder.svg"}
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
                          {product.price && (
                            <p className="text-sm text-muted-foreground">
                              ${product.price.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!loading && !query && recommendedProducts.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Start typing to search products and collections...
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-4 mt-4">
                {results.filter((r) => r.type === "product").length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Products
                    </h3>
                    <div className="space-y-1">
                      {results
                        .filter((r) => r.type === "product")
                        .map((result) => (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className="w-full cursor-pointer flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 transition-colors text-left"
                          >
                            {result.image_url && (
                              <div className="relative h-12 w-12 shrink-0 rounded overflow-hidden bg-muted">
                                <Image
                                  src={result.image_url || "/placeholder.svg"}
                                  alt={result.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {result.name}
                              </p>
                              {result.price && (
                                <p className="text-sm text-muted-foreground">
                                  ${result.price.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {results.filter((r) => r.type === "collection").length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Collections
                    </h3>
                    <div className="space-y-1">
                      {results
                        .filter((r) => r.type === "collection")
                        .map((result) => (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className="w-full flex items-center cursor-pointer gap-3 p-2 rounded-lg hover:bg-gray-200 transition-colors text-left"
                          >
                            {result.image_url && (
                              <div className="relative h-12 w-12 shrink-0 rounded overflow-hidden bg-muted">
                                <Image
                                  src={result.image_url || "/placeholder.svg"}
                                  alt={result.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {result.name}
                              </p>
                              {result.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {result.description}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
