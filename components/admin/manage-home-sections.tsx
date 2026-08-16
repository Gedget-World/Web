"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  GripVertical,
  Plus,
  Trash2,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
  Package,
  X,
  Check,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import type {
  HomePageSection,
  HomePageSectionProduct,
  LegacyHomePageSection,
} from "@/lib/types/home-page-sections";
import { useSearch } from "@/hooks/use-search";
import {
  PRICE_RANGES,
  SearchSortBy,
  SearchResultItem,
} from "@/lib/types/search";

const MAX_SECTION_PRODUCTS = 15;

// Soft cap so the whole setting stays cheap to fetch/deserialize from a Redis-style cache in one round trip.
const JSON_SIZE_LIMIT_BYTES = 100 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ManageHomeSections() {
  const [sections, setSections] = useState<HomePageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  // Add-product picker dialog state
  const [pickerSectionId, setPickerSectionId] = useState<string | null>(null);
  const [pickerLimitWarning, setPickerLimitWarning] = useState(false);
  const [collections, setCollections] = useState<
    { id: string; name: string }[]
  >([]);

  const supabase = useMemo(() => createClient(), []);

  const {
    results: pickerResults,
    loading: pickerLoading,
    query: pickerQuery,
    setQuery: setPickerQuery,
    filters: pickerFilters,
    updateFilter: updatePickerFilter,
    clearFilters: clearPickerFilters,
    sortBy: pickerSortBy,
    setSortBy: setPickerSortBy,
    loadMore: loadMorePickerResults,
    hasMore: hasMorePickerResults,
  } = useSearch({
    enabled: pickerSectionId !== null,
    debounceMs: 300,
    initialSortBy: "newest",
  });

  useEffect(() => {
    loadSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSections() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const { data } = await res.json();
      const raw = (data || []).find(
        (s: { setting_key: string }) => s.setting_key === "home_page_sections",
      );

      let rawSections: LegacyHomePageSection[] = [];
      if (raw?.setting_value) {
        try {
          const value = JSON.parse(raw.setting_value);
          if (Array.isArray(value)) rawSections = value;
        } catch {
          rawSections = [];
        }
      }

      // Older rows only stored product ids — fetch a snapshot once so those
      // sections display correctly and get upgraded to the new shape on save.
      const legacyIds = Array.from(
        new Set(
          rawSections.flatMap((s) => (s.products ? [] : s.productIds || [])),
        ),
      );

      const legacyMap: Record<string, HomePageSectionProduct> = {};
      if (legacyIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select(
            "id, name, slug, price, image_url, discount_percentage, is_active, is_out_of_stock, is_new_arrival, is_featured, reviews(rating)",
          )
          .in("id", legacyIds);
        (products || []).forEach((p) => {
          const reviews = (p.reviews as { rating: number }[]) || [];
          const reviewCount = reviews.length;
          const averageRating =
            reviewCount > 0
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
              : undefined;
          legacyMap[p.id] = {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            image_url: p.image_url,
            discount_percentage: p.discount_percentage,
            is_active: p.is_active,
            is_out_of_stock: p.is_out_of_stock,
            is_new_arrival: p.is_new_arrival,
            is_featured: p.is_featured,
            average_rating: averageRating,
            review_count: reviewCount,
          };
        });
      }

      const normalized: HomePageSection[] = rawSections.map((s) => ({
        id: s.id,
        title: s.title,
        products:
          s.products ??
          (s.productIds || [])
            .map((id) => legacyMap[id])
            .filter((p): p is HomePageSectionProduct => Boolean(p)),
      }));

      setSections(normalized);
    } finally {
      setLoading(false);
    }
  }

  // Collections list for the picker's collection filter
  useEffect(() => {
    fetch("/api/collections")
      .then((res) => res.json())
      .then((data) => setCollections(data.collections || []))
      .catch((error) => console.error("Error fetching collections:", error));
  }, []);

  function markDirty() {
    setHasChanges(true);
    setSaveStatus("idle");
  }

  function addSection() {
    const title = window.prompt("Section title:");
    if (!title || !title.trim()) return;
    const trimmed = title.trim();
    const isDuplicate = sections.some(
      (s) => s.title.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (isDuplicate) {
      window.alert("A section with this name already exists.");
      return;
    }
    setSections((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: trimmed, products: [] },
    ]);
    markDirty();
  }

  function renameSection(id: string, title: string) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
    markDirty();
  }

  function deleteSection(id: string) {
    if (!window.confirm("Delete this section and all its products?")) return;
    setSections((prev) => prev.filter((s) => s.id !== id));
    markDirty();
  }

  function removeProduct(sectionId: string, productId: string) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, products: s.products.filter((p) => p.id !== productId) }
          : s,
      ),
    );
    markDirty();
  }

  function addProduct(sectionId: string, product: HomePageSectionProduct) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId && !s.products.some((p) => p.id === product.id)
          ? { ...s, products: [...s.products, product] }
          : s,
      ),
    );
    markDirty();
  }

  function togglePickerProduct(item: SearchResultItem) {
    if (!pickerSectionId) return;
    const section = sections.find((s) => s.id === pickerSectionId);
    if (!section) return;

    if (section.products.some((p) => p.id === item.id)) {
      removeProduct(pickerSectionId, item.id);
      return;
    }
    if (section.products.length >= MAX_SECTION_PRODUCTS) {
      setPickerLimitWarning(true);
      return;
    }
    setPickerLimitWarning(false);
    addProduct(pickerSectionId, {
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      image_url: item.imageUrl,
      discount_percentage: item.discountPercentage,
      is_active: true,
      is_out_of_stock: item.isOutOfStock,
      is_new_arrival: item.isNewArrival,
      is_featured: item.isFeatured,
    });
  }

  const pickerPriceRangeValue = PRICE_RANGES.findIndex(
    (range) =>
      (pickerFilters.minPrice ?? null) === range.min &&
      (pickerFilters.maxPrice ?? null) === range.max,
  );

  function handlePickerPriceRange(value: string) {
    if (value === "all") {
      updatePickerFilter("minPrice", undefined);
      updatePickerFilter("maxPrice", undefined);
      return;
    }
    const range = PRICE_RANGES[Number(value)];
    updatePickerFilter("minPrice", range.min ?? undefined);
    updatePickerFilter("maxPrice", range.max ?? undefined);
  }

  const pickerActiveFilterCount =
    (pickerFilters.collectionId ? 1 : 0) +
    (pickerFilters.minPrice !== undefined ||
    pickerFilters.maxPrice !== undefined
      ? 1
      : 0) +
    (pickerFilters.isFeatured ? 1 : 0) +
    (pickerFilters.isNewArrival ? 1 : 0) +
    (pickerFilters.inStock ? 1 : 0);

  const duplicateTitleIds = useMemo(() => {
    const counts = new Map<string, number>();
    sections.forEach((s) => {
      const key = s.title.trim().toLowerCase();
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return new Set(
      sections
        .filter((s) => (counts.get(s.title.trim().toLowerCase()) || 0) > 1)
        .map((s) => s.id),
    );
  }, [sections]);

  const hasDuplicateTitles = duplicateTitleIds.size > 0;

  // Size of the JSON blob that will be written to store_settings.setting_value.
  const jsonSizeBytes = useMemo(() => {
    const cleaned = sections
      .map((s) => ({ ...s, title: s.title.trim() }))
      .filter((s) => s.title.length > 0);
    return new TextEncoder().encode(JSON.stringify(cleaned)).length;
  }, [sections]);

  const isOverJsonSizeLimit = jsonSizeBytes > JSON_SIZE_LIMIT_BYTES;

  function handleDragEnd(result: DropResult) {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "SECTION") {
      setSections((prev) => {
        const items = Array.from(prev);
        const [moved] = items.splice(source.index, 1);
        items.splice(destination.index, 0, moved);
        return items;
      });
      markDirty();
      return;
    }

    const sourceSectionId = source.droppableId.replace("products-", "");
    const destSectionId = destination.droppableId.replace("products-", "");

    setSections((prev) => {
      const next = prev.map((s) => ({ ...s, products: [...s.products] }));
      const sourceSection = next.find((s) => s.id === sourceSectionId);
      const destSection = next.find((s) => s.id === destSectionId);
      if (!sourceSection || !destSection) return prev;

      const [moved] = sourceSection.products.splice(source.index, 1);
      destSection.products.splice(destination.index, 0, moved);
      return next;
    });
    markDirty();
  }

  async function handleSave() {
    if (hasDuplicateTitles || isOverJsonSizeLimit) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const cleaned = sections
        .map((s) => ({ ...s, title: s.title.trim() }))
        .filter((s) => s.title.length > 0);

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: [
            {
              setting_key: "home_page_sections",
              setting_value: JSON.stringify(cleaned),
            },
          ],
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSections(cleaned);
      setHasChanges(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error saving home page sections:", error);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const activeSection = sections.find((s) => s.id === pickerSectionId);

  return (
    <div className="mx-4 my-2 min-w-0">
      <header className="p-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Home Page</h1>
          <p className="text-sm text-gray-500">
            Add sections, pick their products, and drag to reorder everything.
          </p>
          <p
            className={`text-xs mt-1 ${
              isOverJsonSizeLimit ? "text-red-600 font-medium" : "text-gray-400"
            }`}
          >
            Saved data size: {formatBytes(jsonSizeBytes)} /{" "}
            {formatBytes(JSON_SIZE_LIMIT_BYTES)} limit
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "success" && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" /> Saved
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" /> Failed to save
            </div>
          )}
          <Button variant="outline" onClick={addSection}>
            <Plus className="w-4 h-4 mr-2" /> Add Section
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !hasChanges || saving || hasDuplicateTitles || isOverJsonSizeLimit
            }
            className="bg-blue-700 hover:bg-blue-800"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save
              </>
            )}
          </Button>
        </div>
      </header>

      {sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border mt-4">
          <p className="text-gray-500">
            No sections yet. Click &quot;Add Section&quot; to create one.
          </p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections" type="SECTION">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-4 mt-4"
              >
                {sections.map((section, index) => (
                  <Draggable
                    key={section.id}
                    draggableId={section.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`w-auto min-w-0 bg-white rounded-lg border p-4 ${
                          snapshot.isDragging
                            ? "shadow-lg border-blue-300 ring-2 ring-blue-100"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            {...provided.dragHandleProps}
                            className="shrink-0 p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex flex-col gap-1 max-w-sm w-full">
                            <Input
                              value={section.title}
                              onChange={(e) =>
                                renameSection(section.id, e.target.value)
                              }
                              className={`font-medium ${
                                duplicateTitleIds.has(section.id)
                                  ? "border-red-400 focus-visible:ring-red-300"
                                  : ""
                              }`}
                              placeholder="Section title"
                            />
                            {duplicateTitleIds.has(section.id) && (
                              <p className="text-xs text-red-600">
                                Another section already uses this name.
                              </p>
                            )}
                          </div>
                          <div className="flex-1" />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPickerSectionId(section.id)}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add Product
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSection(section.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>

                        <Droppable
                          droppableId={`products-${section.id}`}
                          type="PRODUCT"
                          direction="horizontal"
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`w-auto flex items-start gap-3 min-h-38 p-2 rounded-lg border-2 border-dashed overflow-x-auto ${
                                snapshot.isDraggingOver
                                  ? "bg-blue-50 border-blue-200"
                                  : "border-gray-100"
                              }`}
                            >
                              {section.products.length === 0 && (
                                <p className="text-sm text-gray-400 p-2 whitespace-nowrap">
                                  No products yet. Click &quot;Add
                                  Product&quot;.
                                </p>
                              )}
                              {section.products.map((product, pIndex) => {
                                return (
                                  <Draggable
                                    key={product.id}
                                    draggableId={`${section.id}::${product.id}`}
                                    index={pIndex}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`group relative w-36 shrink-0 bg-gray-50 border rounded-lg overflow-hidden ${
                                          snapshot.isDragging
                                            ? "shadow-lg border-blue-300"
                                            : "border-gray-200"
                                        }`}
                                      >
                                        <div
                                          {...provided.dragHandleProps}
                                          className="absolute top-1.5 left-1.5 z-10 p-1 rounded-full bg-white/90 shadow hover:bg-white cursor-grab active:cursor-grabbing"
                                        >
                                          <GripVertical className="w-3.5 h-3.5 text-gray-500" />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeProduct(
                                              section.id,
                                              product.id,
                                            )
                                          }
                                          className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full bg-white/90 shadow hover:bg-white"
                                        >
                                          <X className="w-3.5 h-3.5 text-gray-600" />
                                        </button>
                                        <div className="relative aspect-square bg-gray-100">
                                          {product?.image_url ? (
                                            <Image
                                              src={product.image_url}
                                              alt={product.name}
                                              fill
                                              sizes="144px"
                                              className="object-contain p-2"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <Package className="w-6 h-6 text-gray-400" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="p-2">
                                          <p className="text-xs font-medium line-clamp-2 leading-snug min-h-8">
                                            {product?.name || "Unknown product"}
                                          </p>
                                          {product && (
                                            <p className="text-xs text-gray-500 mt-1">
                                              ₹{product.price}
                                              {product.is_out_of_stock &&
                                                " · Out of stock"}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {isOverJsonSizeLimit && (
        <div className="mx-2 mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-800">
            Saved data ({formatBytes(jsonSizeBytes)}) exceeds the{" "}
            {formatBytes(JSON_SIZE_LIMIT_BYTES)} limit for an efficient cache
            fetch. Remove some products or sections before saving.
          </p>
        </div>
      )}

      {hasDuplicateTitles && (
        <div className="mx-2 mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-800">
            Section names must be unique. Rename the duplicate sections
            highlighted above before saving.
          </p>
        </div>
      )}

      {hasChanges && !hasDuplicateTitles && (
        <div className="mx-2 mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800">
            You have unsaved changes. Click &quot;Save&quot; to apply them.
          </p>
        </div>
      )}

      <Dialog
        open={pickerSectionId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPickerSectionId(null);
            setPickerLimitWarning(false);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="top-0 left-0 translate-x-0 translate-y-0 w-screen h-screen max-w-none sm:max-w-none max-h-none rounded-none p-0 gap-0 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b shrink-0">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold truncate">
                Add products
                {activeSection ? ` to "${activeSection.title}"` : ""}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                {activeSection?.products.length || 0}/{MAX_SECTION_PRODUCTS}{" "}
                product
                {activeSection?.products.length === 1 ? "" : "s"} selected
              </DialogDescription>
            </div>
            <Button
              onClick={() => {
                setPickerSectionId(null);
                setPickerLimitWarning(false);
              }}
            >
              Done
            </Button>
          </div>

          {pickerLimitWarning && (
            <div className="px-4 sm:px-6 py-2 border-b shrink-0 bg-amber-50">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> You can add up to{" "}
                {MAX_SECTION_PRODUCTS} products per section. Remove a product
                before adding another.
              </p>
            </div>
          )}

          {/* Filters toolbar */}
          <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-3 border-b shrink-0 bg-gray-50">
            <Input
              autoFocus
              placeholder="Search by name..."
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              className="w-full sm:w-64 bg-white"
            />

            <Select
              value={pickerFilters.collectionId || "all"}
              onValueChange={(value) =>
                updatePickerFilter(
                  "collectionId",
                  value === "all" ? undefined : value,
                )
              }
            >
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder="Collection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collections</SelectItem>
                {collections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={
                pickerPriceRangeValue >= 0
                  ? String(pickerPriceRangeValue)
                  : "all"
              }
              onValueChange={handlePickerPriceRange}
            >
              <SelectTrigger className="w-[170px] bg-white">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Price</SelectItem>
                {PRICE_RANGES.map((range, index) => (
                  <SelectItem key={range.label} value={String(index)}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={pickerSortBy}
              onValueChange={(value) => setPickerSortBy(value as SearchSortBy)}
            >
              <SelectTrigger className="w-[170px] bg-white">
                <SlidersHorizontal className="w-4 h-4 mr-1.5" />
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

            <Badge
              variant={pickerFilters.isFeatured ? "default" : "outline"}
              className="cursor-pointer h-9 px-3"
              onClick={() =>
                updatePickerFilter(
                  "isFeatured",
                  pickerFilters.isFeatured ? undefined : true,
                )
              }
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Featured
            </Badge>
            <Badge
              variant={pickerFilters.isNewArrival ? "default" : "outline"}
              className="cursor-pointer h-9 px-3"
              onClick={() =>
                updatePickerFilter(
                  "isNewArrival",
                  pickerFilters.isNewArrival ? undefined : true,
                )
              }
            >
              New Arrival
            </Badge>
            <Badge
              variant={pickerFilters.inStock ? "default" : "outline"}
              className="cursor-pointer h-9 px-3"
              onClick={() =>
                updatePickerFilter(
                  "inStock",
                  pickerFilters.inStock ? undefined : true,
                )
              }
            >
              In Stock
            </Badge>

            {pickerActiveFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearPickerFilters}>
                <X className="w-4 h-4 mr-1" /> Clear filters
              </Button>
            )}
          </div>

          {/* Results grid */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {pickerLoading && !pickerResults ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : !pickerResults || pickerResults.items.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">
                No products found.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {pickerResults.items.map((item) => {
                    const selected =
                      activeSection?.products.some((p) => p.id === item.id) ??
                      false;
                    const limitReached =
                      !selected &&
                      (activeSection?.products.length ?? 0) >=
                        MAX_SECTION_PRODUCTS;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => togglePickerProduct(item)}
                        aria-disabled={limitReached}
                        className={`group text-left rounded-lg border overflow-hidden bg-white transition-all ${
                          selected
                            ? "border-blue-500 ring-2 ring-blue-100"
                            : limitReached
                              ? "border-gray-200 opacity-50 cursor-not-allowed"
                              : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="relative aspect-square bg-gray-50">
                          <Image
                            src={
                              item.imageUrl ||
                              "/placeholder.svg?height=300&width=300"
                            }
                            alt={item.name}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
                            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          />
                          {selected && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {item.isOutOfStock && (
                            <Badge className="absolute bottom-2 left-2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5">
                              Sold Out
                            </Badge>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs sm:text-sm font-medium line-clamp-2 leading-snug">
                            {item.name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            ₹{item.price}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {hasMorePickerResults && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      onClick={loadMorePickerResults}
                      disabled={pickerLoading}
                    >
                      {pickerLoading && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
