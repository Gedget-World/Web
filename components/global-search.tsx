"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface SearchResult {
  type: "product" | "collection"
  id: string
  name: string
  slug: string
  image_url?: string
  price?: number
  description?: string
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const searchAll = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        // Search products
        const { data: products } = await supabase
          .from("products")
          .select("id, name, slug, image_url, price, description")
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(5)

        // Search collections
        const { data: collections } = await supabase
          .from("collections")
          .select("id, name, slug, image_url, description")
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(5)

        const productResults: SearchResult[] =
          products?.map((p) => ({
            type: "product" as const,
            id: p.id,
            name: p.name,
            slug: p.slug,
            image_url: p.image_url,
            price: p.price,
            description: p.description,
          })) || []

        const collectionResults: SearchResult[] =
          collections?.map((c) => ({
            type: "collection" as const,
            id: c.id,
            name: c.name,
            slug: c.slug,
            image_url: c.image_url,
            description: c.description,
          })) || []

        setResults([...productResults, ...collectionResults])
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      searchAll(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchAll])

  const handleResultClick = (result: SearchResult) => {
    const path = result.type === "product" ? `/products/${result.slug}` : `/collections/${result.slug}`
    router.push(path)
    setOpen(false)
    setQuery("")
    setResults([])
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 md:w-64 md:justify-start md:px-3 bg-transparent"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline-flex text-sm text-muted-foreground">Search products, collections...</span>
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="sr-only">Search</DialogTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products, collections..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 pr-9 h-12 text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                  onClick={() => {
                    setQuery("")
                    setResults([])
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto px-4 pb-4">
            {loading && <div className="py-8 text-center text-sm text-muted-foreground">Searching...</div>}

            {!loading && query && results.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No results found for "{query}"</div>
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
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                          >
                            {result.image_url && (
                              <div className="relative h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                                <Image
                                  src={result.image_url || "/placeholder.svg"}
                                  alt={result.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{result.name}</p>
                              {result.price && (
                                <p className="text-sm text-muted-foreground">${result.price.toFixed(2)}</p>
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
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                          >
                            {result.image_url && (
                              <div className="relative h-12 w-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                                <Image
                                  src={result.image_url || "/placeholder.svg"}
                                  alt={result.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{result.name}</p>
                              {result.description && (
                                <p className="text-xs text-muted-foreground truncate">{result.description}</p>
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
  )
}
