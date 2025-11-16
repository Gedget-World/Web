"use client";

import { useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import debounce from "lodash.debounce";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Image as LucideImage, Plus, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CreateCollectionPage() {
  const supabase = createClient();
  const router = useRouter();

  const [collection, setCollection] = useState({
    name: "",
    description: "",
    image_urls: "",
    image_name: "",
    is_active: true,
    is_featured: false,
    seo_title: "",
    seo_keyword: "",
    seo_description: "",
  });

  // Slug
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
        .from("collections")
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

  const handleChange = (key: string, value: any) => {
    setCollection((prev) => ({ ...prev, [key]: value }));
  };

  // Thumbnail Image Handlers
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
      setCollection((prev) => ({
        ...prev,
        image_name: data?.path,
      }));
      const { data: publicData } = supabase.storage
        .from("product_thumbnail_images")
        .getPublicUrl(fileName);
      console.log("File uploaded successfully:", publicData);
      setCollection((prev) => ({
        ...prev,
        image_urls: publicData.publicUrl,
      }));
    }
  };

  const _handleThumbnailImageDelete = async () => {
    if (!collection.image_name) return;

    console.log("Deleting image:", collection.image_name);

    const thumbnailBucket =
      process.env.NEXT_PUBLIC_SUPABASE_THUMBNAIL_BUCKET ||
      "product_thumbnail_images";
    const { data, error } = await supabase.storage
      .from(thumbnailBucket)
      .remove([collection.image_name]);

    if (error) {
      console.error("Error deleting image:", error);
      return;
    }

    console.log("Image deleted successfully:", data);

    console.log("Deleted image data:", data);
    setCollection((prev) => ({
      ...prev,
      image_name: "",
      image_urls: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [nameValidationError, setNameValidationError] = useState(false);
  const [slugValidationError, setSlugValidationError] = useState(false);
  const [descriptionValidationError, setDescriptionValidationError] =
    useState(false);
  const [thumbnailValidationError, setThumbnailValidationError] =
    useState(false);
  const [seoTitleValidationError, setSeoTitleValidationError] = useState(false);
  const [seoKeywordValidationError, setSeoKeywordValidationError] =
    useState(false);
  const [seoDescriptionValidationError, setSeoDescriptionValidationError] =
    useState(false);

  const collectionValidation = () => {
    setNameValidationError(false);
    setSlugValidationError(false);
    setDescriptionValidationError(false);
    setThumbnailValidationError(false);
    setSeoTitleValidationError(false);
    setSeoKeywordValidationError(false);
    setSeoDescriptionValidationError(false);
    let res = true;

    if (collection.name.trim() === "") {
      setNameValidationError(true);
      res = false;
    } else {
      setNameValidationError(false);
    }

    if (status === "taken" || slug.trim() === "") {
      setSlugValidationError(true);
      res = false;
    } else {
      setSlugValidationError(false);
    }

    if (collection.description.trim() === "") {
      setDescriptionValidationError(true);
      res = false;
    } else {
      setDescriptionValidationError(false);
    }

    if (collection.image_urls.trim() === "") {
      setThumbnailValidationError(true);
      res = false;
    } else {
      setThumbnailValidationError(false);
    }

    if (collection.seo_title.trim() === "") {
      setSeoTitleValidationError(true);
      res = false;
    } else {
      setSeoTitleValidationError(false);
    }

    if (collection.seo_keyword.trim() === "") {
      setSeoKeywordValidationError(true);
      res = false;
    } else {
      setSeoKeywordValidationError(false);
    }

    if (collection.seo_description.trim() === "") {
      setSeoDescriptionValidationError(true);
      res = false;
    } else {
      setSeoDescriptionValidationError(false);
    }

    return res;
  };

  const handleSubmit = async () => {
    console.log("Creating collection:", collection);

    if (!collectionValidation()) {
      console.log("Collection validation failed");
      return;
    }

    const { data, error } = await supabase
      .from("collections")
      .insert([
        {
          name: collection.name,
          slug: slug,
          description: collection.description,
          image_name: collection.image_name,
          image_url: collection.image_urls,
          is_active: collection.is_active,
          is_featured: collection.is_featured,
          seo_title: collection.seo_title,
          seo_keywords: collection.seo_keyword,
          seo_description: collection.seo_description,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating collection:", error);
      alert("Error creating collection. Please try again.");
      return;
    }
    console.log("Collection created successfully:", data);
    alert("Collection created successfully!");
    router.push("/admin/dashboard/Collections");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Create New Collection
          </CardTitle>
          <CardDescription>
            Fill in the details below to add a new collection to your store.
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
              {collection.image_urls.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 w-full p-4 rounded border border-dashed border-gray-300">
                  <div className="w-10 h-10 bg-gray-300 rounded-3xl flex items-center justify-center">
                    <LucideImage className="text-gray-600 w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-400">No image added</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {collection.image_urls == "" ? null : (
                    <div
                      className="relative w-[150px] flex flex-col border border-gray-300 
                        items-center justify-center p-2 rounded"
                    >
                      <Image
                        src={collection.image_urls}
                        alt="Product image"
                        width={100}
                        height={100}
                      />
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="cursor-pointer"
                          onClick={() => _handleThumbnailImageDelete()}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFilesSelected}
              />
              {collection.image_urls === "" && (
                <Button
                  className="mt-3 w-fit"
                  variant="outline"
                  onClick={handleClick}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Thumbnail Image
                </Button>
              )}
              {thumbnailValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  Please add a thumbnail image.
                </p>
              )}
            </div>
          </div>

          {/* RIGHT SIDE - DETAILS FORM */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Collection Name
              </label>
              <Input
                placeholder="Enter collection name"
                value={collection.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              {nameValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  Collection name is required.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">Slug</label>
              <Input
                placeholder="example-collection"
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
              {slugValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  Please provide a valid and unique slug.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Seo Title
              </label>
              <Input
                type="text"
                value={collection.seo_title}
                onChange={(e) => handleChange("seo_title", e.target.value)}
              />
              {seoTitleValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  Please provide a SEO title.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Seo Keyword (Keyword1, Keyword2, ...)
              </label>
              <Input
                type="text"
                value={collection.seo_keyword}
                onChange={(e) => handleChange("seo_keyword", e.target.value)}
              />
              {seoKeywordValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  Please provide SEO keywords.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Seo Description
              </label>
              <Textarea
                value={collection.seo_description}
                onChange={(e) =>
                  handleChange("seo_description", e.target.value)
                }
              />
              {seoDescriptionValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  Please provide a SEO description.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Description
              </label>
              <Textarea
                placeholder="Describe your collection..."
                value={collection.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
              {descriptionValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  Description is required.
                </p>
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
                    checked={
                      collection[key as keyof typeof collection] as boolean
                    }
                    onCheckedChange={(val) => handleChange(key, val)}
                  />
                </div>
              ))}
            </div>

            <div className="pt-6 flex justify-end">
              <Button className="px-6" onClick={handleSubmit}>
                Create Collection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
