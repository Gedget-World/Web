"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Image as LucideImage, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

export default function CreateProductPage() {
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: 0,
    discount_percentage: 0,
    stock: 0,
    image_urls: [],
    collection_id: "",
    is_active: true,
    is_featured: false,
    is_new_arrival: false,
    slug: "",
  });

  const [collections] = useState([
    { id: "a9e064bc-a81f-42f0-92ec-6247b0875e63", name: "Essentials" },
    { id: "b0b3456a-23ef-45aa-93d1-f021f9f4a1ef", name: "Premium" },
    { id: "c8d2348f-12df-49aa-87a2-8123ac0a12cd", name: "Summer" },
  ]);

  const handleChange = (key: string, value: any) => {
    setProduct((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    console.log("Creating product:", product);
    // TODO: Replace with actual API call
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Create New Product
          </CardTitle>
          <CardDescription>
            Fill in the details below to add a new product to your store.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT SIDE - IMAGES */}
          <div className="flex flex-col">
            {/* Thumbnail Image */}
            <div>
              <p className="text-left text-gray-500 text-sm mb-2">
                Thumbnail Image
              </p>
              {product.image_urls.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 w-full p-4 rounded border border-dashed border-gray-300">
                  <div className="w-10 h-10 bg-gray-300 rounded-3xl flex items-center justify-center">
                    <LucideImage className="text-gray-600 w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-400">No image added</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {product.image_urls.map((url, i) => (
                    <div key={i} className="relative">
                      <Image
                        src={url}
                        alt={`Product image ${i + 1}`}
                        width={200}
                        height={200}
                        className="rounded-md object-cover border"
                      />
                    </div>
                  ))}
                </div>
              )}
              <Button className="mt-3 w-fit" variant="outline">
                <Plus className="w-4 h-4 mr-1" /> Add Image
              </Button>
            </div>
          </div>

          {/* RIGHT SIDE - DETAILS FORM */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Product Name
              </label>
              <Input
                placeholder="Enter product name"
                value={product.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Slug</label>
              <Input
                placeholder="example-product"
                value={product.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Price ($)
                </label>
                <Input
                  type="number"
                  value={product.price}
                  onChange={(e) =>
                    handleChange("price", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Discount (%)
                </label>
                <Input
                  type="number"
                  value={product.discount_percentage}
                  onChange={(e) =>
                    handleChange(
                      "discount_percentage",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Stock</label>
              <Input
                type="number"
                value={product.stock}
                onChange={(e) =>
                  handleChange("stock", parseInt(e.target.value) || 0)
                }
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Collection
              </label>
              <Select
                value={product.collection_id}
                onValueChange={(val) => handleChange("collection_id", val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Description
              </label>
              <Textarea
                placeholder="Describe your product..."
                value={product.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 gap-4 pt-4">
              {[
                { key: "is_active", label: "Active" },
                { key: "is_featured", label: "Featured" },
                { key: "is_new_arrival", label: "New Arrival" },
              ].map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                >
                  <label className="text-sm text-gray-600">{label}</label>
                  <Switch
                    checked={product[key as keyof typeof product] as boolean}
                    onCheckedChange={(val) => handleChange(key, val)}
                  />
                </div>
              ))}
            </div>

            <div className="pt-6 flex justify-end">
              <Button className="px-6" onClick={handleSubmit}>
                Create Product
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
