"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Image as LucideImage } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pencil, Check, X, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

export default function ProductDetailsPage() {
  const [editingField, setEditingField] = useState<string | null>(null);

  const [product, setProduct] = useState({
    id: "ac88b8cb-9232-458a-ae4b-7711f612e429",
    name: "Classic White T-Shirt",
    description: "A timeless wardrobe essential made from premium cotton",
    price: 29.99,
    discount_percentage: 20,
    stock: 50,
    image_urls: [
      "/placeholder.svg?height=500&width=400",
      "/placeholder.svg?height=500&width=400",
    ],
    collection_id: "a9e064bc-a81f-42f0-92ec-6247b0875e63",
    is_active: true,
    is_featured: true,
    is_new_arrival: true,
    slug: "classic-white-tshirt",
    sales_count: 56,
    created_at: "2025-10-30T17:10:22.788537+00:00",
  });

  const [collections] = useState([
    { id: "a9e064bc-a81f-42f0-92ec-6247b0875e63", name: "Essentials" },
    { id: "b0b3456a-23ef-45aa-93d1-f021f9f4a1ef", name: "Premium" },
    { id: "c8d2348f-12df-49aa-87a2-8123ac0a12cd", name: "Summer" },
  ]);

  const handleChange = (key: string, value: any) => {
    setProduct((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {product.name}
          </CardTitle>
          <CardDescription>
            {`Manage and edit the details of "${product.slug}"`}
          </CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            {/* Thumbnails Section */}
            <div>
              <p className="text-left text-gray-500 text-sm mb-2">
                Thumbnail Image
              </p>
              {/* If no image is present, show placeholder */}
              <div className="flex flex-col items-center justify-center gap-4 w-full p-4 rounded border border-dashed border-gray-300">
                <div className="w-10 h-10 bg-gray-300 rounded-3xl flex items-center justify-center">
                  <LucideImage className="text-gray-600 w-5 h-5" />
                </div>
                <p className="text-xs text-gray-400">Please add an image</p>
              </div>
              {/* If image is present, show image preview */}

              <Button
                className="mt-3 w-fit"
                variant={"outline"}
                // onClick={addNewImage}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Image
              </Button>
            </div>
          </div>

          {/* Editable Product Info */}
          <div className="space-y-4">
            {[
              { key: "name", label: "Collection Name", type: "text" },
              { key: "slug", label: "Slug", type: "text" },
              { key: "Seo Title", label: "Seo Title", type: "text" },
              { key: "Seo Keyword", label: "Seo Keyword", type: "text" },
              {
                key: "Seo Description",
                label: "Seo Description",
                type: "textarea",
              },
            ].map(({ key, label, type }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="w-full">
                  <label className="block text-sm text-gray-500">{label}</label>
                  {editingField === key ? (
                    <div className="flex gap-2 items-center">
                      <Input
                        type={type}
                        value={product[key as keyof typeof product] as any}
                        onChange={(e) =>
                          handleChange(
                            key,
                            type === "number"
                              ? parseFloat(e.target.value) || 0
                              : e.target.value
                          )
                        }
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setEditingField(null)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setEditingField(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-base">
                        {product[key as keyof typeof product]}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingField(key)}
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Description */}
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Description
              </label>
              {editingField === "description" ? (
                <div className="space-y-2">
                  <Textarea
                    value={product.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                  />
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setEditingField(null)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setEditingField(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <p className="text-base max-w-lg">{product.description}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingField("description")}
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>
              )}
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 gap-4 pt-4">
              {[
                { key: "is_active", label: "Active" },
                { key: "is_featured", label: "Featured" },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                >
                  <label className="text-sm text-gray-600">{label}</label>
                  <Switch
                    checked={product[key as keyof typeof product] as boolean}
                    onCheckedChange={(val) => handleChange(key, val)}
                    className="cursor-pointer"
                  />
                </div>
              ))}
            </div>

            <div className="pt-6 flex justify-end">
              <Button className="px-6">Save All Changes</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
