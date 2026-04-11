"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  GripVertical,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Layers,
} from "lucide-react";

interface Collection {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  parent_id: string | null;
  parent?: { name: string } | null;
}

export default function ReorderCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/admin/collections/reorder");
      if (!response.ok) throw new Error("Failed to fetch collections");
      const { data } = await response.json();
      setCollections(data || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(collections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display_order based on new positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index + 1,
    }));

    setCollections(updatedItems);
    setHasChanges(true);
    setSaveStatus("idle");
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");

    try {
      const response = await fetch("/api/admin/collections/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collections: collections.map((c) => ({
            id: c.id,
            display_order: c.display_order,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to save order");

      setHasChanges(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Error saving order:", error);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-4 my-2">
      {/* Header */}
      <header className="p-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard/Collections"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Reorder Collections</h1>
            <p className="text-sm text-gray-500">
              Drag and drop to change the display order
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === "success" && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              Saved successfully
            </div>
          )}
          {saveStatus === "error" && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              Failed to save
            </div>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-blue-700 hover:bg-blue-800"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Order
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Instructions */}
      <div className="mx-2 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-3">
          <Layers className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium">
              How to reorder collections
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Drag collections using the grip handle to change their display
              order. Collections at the top will appear first in the navigation
              bar each pages. Click "Save Order" to apply changes.
            </p>
          </div>
        </div>
      </div>

      {/* Drag and Drop List */}
      <main className="mt-6 mx-2">
        {collections.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border">
            <p className="text-gray-500">No collections found</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="collections">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 p-4 rounded-lg border transition-colors ${
                    snapshot.isDraggingOver
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {collections.map((collection, index) => (
                    <Draggable
                      key={collection.id}
                      draggableId={collection.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-4 p-4 bg-white rounded-lg border transition-all ${
                            snapshot.isDragging
                              ? "shadow-lg border-blue-300 ring-2 ring-blue-100"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="shrink-0 p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="w-5 h-5 text-gray-400" />
                          </div>

                          {/* Position Number */}
                          <div className="shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {index + 1}
                            </span>
                          </div>

                          {/* Collection Image */}
                          {collection.image_url ? (
                            <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                src={collection.image_url}
                                alt={collection.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Layers className="w-5 h-5 text-gray-400" />
                            </div>
                          )}

                          {/* Collection Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900 truncate">
                                {collection.name}
                              </h3>
                              {collection.parent && (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-normal"
                                >
                                  {collection.parent.name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              /{collection.slug}
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0">
                            {collection.is_active ? (
                              <Badge className="rounded-full border-none bg-green-600/10 text-green-600">
                                <span className="size-1.5 rounded-full bg-green-600 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge className="rounded-full border-none bg-red-600/10 text-red-500">
                                <span className="size-1.5 rounded-full bg-red-600 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </div>
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
      </main>

      {/* Footer hint */}
      {hasChanges && (
        <div className="mx-2 mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800">
            ⚠️ You have unsaved changes. Click "Save Order" to apply them.
          </p>
        </div>
      )}
    </div>
  );
}
