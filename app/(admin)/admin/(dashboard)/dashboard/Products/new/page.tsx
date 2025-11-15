"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Image as LucideImage,
  Plus,
  Trash2,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import MultipleImagesHandle from "@/components/admin/multiple-images-handle";

export default function CreateProductPage() {
  const supabase = createClient();
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: 0,
    discount_percentage: 0,
    stock: 0,
    image_urls: "" as string,
    image_name: "" as string,
    collection_id: "",
    is_active: true,
    is_featured: false,
    is_new_arrival: false,
  });

  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"checking" | "available" | "taken" | "">(
    ""
  );

  // --- Debounced function (runs only after user stops typing) ---
  const checkSlug = useCallback(
    debounce(async (value: string) => {
      if (!value) return;

      setStatus("checking");

      const { data, error } = await supabase
        .from("products")
        .select("id")
        .eq("slug", value)
        .maybeSingle();

      if (error) {
        console.error(error);
        return;
      }

      setStatus(data ? "taken" : "available");
    }, 500), // delay: 500ms
    []
  );

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      setSlug("");
      setStatus("");
      return;
    }
    const newSlug = e.target.value.toLowerCase().trim().replaceAll(" ", "-");
    setSlug(newSlug);
    checkSlug(newSlug);
  };

  const [collections, setCollections] = useState([
    { id: "a9e064bc-a81f-42f0-92ec-6247b0875e63", name: "Essentials" },
    { id: "b0b3456a-23ef-45aa-93d1-f021f9f4a1ef", name: "Premium" },
    { id: "c8d2348f-12df-49aa-87a2-8123ac0a12cd", name: "Summer" },
  ]);
  const [loadingCollections, setLoadingCollections] = useState(false);

  // Initial page load
  useEffect(() => {
    const fetchCollections = async () => {
      setLoadingCollections(true);
      const { data, error } = await supabase
        .from("collections")
        .select("id, name");
      if (error) {
        console.error("Error fetching collections:", error);
        return;
      }
      if (data) {
        console.log("Fetched collections:", data);
        setCollections(data);
      }
      setLoadingCollections(false);
    };
    // console.log("ENV VAR:", process.env.NEXT_PUBLIC_SUPABASE_THUMBNAIL_BUCKET);
    // console.log("ENV VAR:", process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_BUCKET);
    fetchCollections();
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    console.log("Selected files:", files);
    if (!files || files.length === 0) return;

    if (files) {
      const fileName = `${Date.now()}-${files[0].name}`;
      console.log("Uploading file with name:", fileName);
      const thumbnailBucket =
        process.env.NEXT_PUBLIC_SUPABASE_THUMBNAIL_BUCKET ||
        "product_thumbnail_images";
      const { data, error } = await supabase.storage
        .from(thumbnailBucket) // bucket name
        .upload(fileName, files[0]);

      if (error) {
        console.error("Upload error:", error);
        return;
      }

      console.log("Upload data:", data);
      setProduct((prev) => ({
        ...prev,
        image_name: data?.path,
      }));
      const { data: publicData } = supabase.storage
        .from("product_thumbnail_images")
        .getPublicUrl(fileName);
      console.log("File uploaded successfully:", publicData);
      setProduct((prev) => ({
        ...prev,
        image_urls: publicData.publicUrl,
      }));
    }
  };

  useEffect(() => {
    console.log("Product state updated:", product);
  }, [product]);

  const _handleThumbnailImageDelete = async () => {
    if (!product.image_name) return;

    console.log("Deleting image:", product.image_name);

    const thumbnailBucket =
      process.env.NEXT_PUBLIC_SUPABASE_THUMBNAIL_BUCKET ||
      "product_thumbnail_images";
    const { data, error } = await supabase.storage
      .from(thumbnailBucket)
      .remove([product.image_name]);

    if (error) {
      console.error("Error deleting image:", error);
      return;
    }

    console.log("Image deleted successfully:", data);

    console.log("Deleted image data:", data);
    setProduct((prev) => ({
      ...prev,
      image_name: "",
      image_urls: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
                  {product.image_urls == "" ? null : (
                    <div className="relative">
                      <Image
                        src={product.image_urls}
                        alt="Product image"
                        width={200}
                        height={200}
                        className="rounded-md object-cover border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 p-1 rounded-full"
                        onClick={() => _handleThumbnailImageDelete()}
                      >
                        X
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFilesSelected}
              />
              {product.image_urls.length === 0 && (
                <Button
                  className="mt-3 w-fit"
                  variant="outline"
                  onClick={handleClick}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Thumbnail Image
                </Button>
              )}
            </div>
            {/* Product Image Section */}
            <div className="mt-5">
              <p className="text-left text-gray-500 text-sm mb-2">
                Product Image
              </p>
              {/* If no image is present, show placeholder */}
              <div className="flex flex-col items-center justify-center w-full p-4 rounded border border-dashed border-gray-300">
                <div className="w-10 h-10 bg-gray-300 rounded-3xl flex items-center justify-center">
                  <LucideImage className="text-gray-600 w-5 h-5" />
                </div>
                <p className="text-sm mt-2 text-gray-500">
                  Please add a product image
                </p>
                <p className="text-xs text-gray-400">
                  (You can add multiple images)
                </p>
              </div>
              {/* If image is present, show image preview */}
              <MultipleImagesHandle />

              <Button
                className="mt-3 w-fit"
                variant={"outline"}
                // onClick={addNewImage}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Product Image
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
                value={slug}
                onChange={handleSlugChange}
              />
              {/* UI feedback */}
              {status === "checking" && (
                <p className="text-blue-500 text-xs mt-1 font-semibold">
                  Checking...
                </p>
              )}
              {status === "available" && (
                <p className="text-green-600 text-xs mt-1 font-semibold">
                  Slug is available
                </p>
              )}
              {status === "taken" && (
                <p className="text-red-500 text-xs mt-1 font-semibold">
                  Slug already exists
                </p>
              )}
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
              {loadingCollections && (
                <p className="text-gray-500 text-xs mt-1">
                  Loading collections...
                </p>
              )}
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
