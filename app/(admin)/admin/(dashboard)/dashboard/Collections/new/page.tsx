"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import debounce from "lodash.debounce";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Image as LucideImage, Plus, Trash2, Loader2 } from "lucide-react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ParentCollection {
  id: string;
  name: string;
  parent_id: string | null;
}

export default function CreateCollectionPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const presetParentId = searchParams.get("parent");
  const isEditMode = !!editId;

  const [loading, setLoading] = useState(isEditMode);
  const [parentCollections, setParentCollections] = useState<
    ParentCollection[]
  >([]);
  const [parentId, setParentId] = useState<string | null>(presetParentId);
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
  const [originalSlug, setOriginalSlug] = useState("");
  const [status, setStatus] = useState<"checking" | "available" | "taken" | "">(
    "",
  );

  // Fetch available parent collections
  useEffect(() => {
    const fetchParentCollections = async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, name, parent_id")
        .order("name");

      if (!error && data) {
        // Filter out current collection (can't be its own parent) and its descendants
        const filtered = editId ? data.filter((c) => c.id !== editId) : data;
        setParentCollections(filtered);
      }
    };
    fetchParentCollections();
  }, [supabase, editId]);

  // Fetch existing collection data when editing
  useEffect(() => {
    if (!editId) return;

    const fetchCollection = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", editId)
        .single();

      if (error || !data) {
        console.error("Error fetching collection:", error);
        alert("Collection not found");
        router.push("/admin/dashboard/Collections");
        return;
      }

      setCollection({
        name: data.name || "",
        description: data.description || "",
        image_urls: data.image_url || "",
        image_name: data.image_name || "",
        is_active: data.is_active ?? true,
        is_featured: data.is_featured ?? false,
        seo_title: data.seo_title || "",
        seo_keyword: data.seo_keywords || "",
        seo_description: data.seo_description || "",
      });
      setSlug(data.slug || "");
      setOriginalSlug(data.slug || "");
      setParentId(data.parent_id || null);
      setLoading(false);
    };

    fetchCollection();
  }, [editId, supabase, router]);

  // --- Debounced function (runs only after user stops typing) ---
  const checkSlug = useCallback(
    debounce(async (value: string) => {
      if (!value) return;

      // If editing and slug hasn't changed, it's available
      if (isEditMode && value === originalSlug) {
        setStatus("available");
        return;
      }

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
    [isEditMode, originalSlug],
  );

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      setSlug("");
      setStatus("");
      return;
    }
    // Remove spaces, special characters (except hyphen), numbers, and convert to lowercase
    const newSlug = e.target.value.toLowerCase().replace(/[^a-z-]/g, "");
    setSlug(newSlug);
    if (newSlug) {
      checkSlug(newSlug);
    } else {
      setStatus("");
    }
  };

  // Handle paste for slug - sanitize input
  const handleSlugPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    // Remove spaces, special characters (except hyphen), numbers, and convert to lowercase
    const sanitized = pastedText.toLowerCase().replace(/[^a-z-]/g, "");
    setSlug(sanitized);
    if (sanitized) {
      checkSlug(sanitized);
    } else {
      setStatus("");
    }
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
    event: React.ChangeEvent<HTMLInputElement>,
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
        .upload(fileName, files[0], {
          cacheControl: "31536000",
          upsert: false,
        });

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
  const [seoTitleValidationError, setSeoTitleValidationError] = useState(false);
  const [seoKeywordValidationError, setSeoKeywordValidationError] =
    useState(false);
  const [seoDescriptionValidationError, setSeoDescriptionValidationError] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const collectionValidation = () => {
    setNameValidationError(false);
    setSlugValidationError(false);
    setDescriptionValidationError(false);
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
      // In edit mode, if slug matches original, it's valid
      if (isEditMode && slug === originalSlug) {
        setSlugValidationError(false);
      } else {
        setSlugValidationError(true);
        res = false;
      }
    } else {
      setSlugValidationError(false);
    }

    if (collection.description.trim() === "") {
      setDescriptionValidationError(true);
      res = false;
    } else {
      setDescriptionValidationError(false);
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
    console.log(
      isEditMode ? "Updating collection:" : "Creating collection:",
      collection,
    );

    if (!collectionValidation()) {
      console.log("Collection validation failed");
      return;
    }

    setIsSubmitting(true);

    const collectionData = {
      name: collection.name,
      slug: slug,
      description: collection.description,
      image_name: collection.image_name || null,
      image_url: collection.image_urls || null,
      is_active: collection.is_active,
      is_featured: collection.is_featured,
      seo_title: collection.seo_title,
      seo_keywords: collection.seo_keyword,
      seo_description: collection.seo_description,
      parent_id: parentId,
    };

    if (isEditMode) {
      // Update existing collection (display_order stays the same)
      const { error } = await supabase
        .from("collections")
        .update(collectionData)
        .eq("id", editId);

      if (error) {
        console.error("Error updating collection:", error);
        alert("Error updating collection. Please try again.");
        setIsSubmitting(false);
        return;
      }
      alert("Collection updated successfully!");
    } else {
      // Get the max display_order to add new collection at the end
      const { data: maxOrderData } = await supabase
        .from("collections")
        .select("display_order")
        .order("display_order", { ascending: false })
        .limit(1)
        .single();

      const nextDisplayOrder = (maxOrderData?.display_order || 0) + 1;

      // Create new collection with display_order
      const { data, error } = await supabase
        .from("collections")
        .insert([{ ...collectionData, display_order: nextDisplayOrder }])
        .select();

      if (error) {
        console.error("Error creating collection:", error);
        alert("Error creating collection. Please try again.");
        setIsSubmitting(false);
        return;
      }
      console.log("Collection created successfully:", data);
    }

    setIsSubmitting(false);
    router.push("/admin/dashboard/Collections");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Card className="border">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              {isEditMode
                ? "Edit Collection"
                : presetParentId
                  ? "Create Sub-collection"
                  : "Create New Collection"}
            </CardTitle>
            <CardDescription>
              {isEditMode
                ? "Update the collection details below."
                : presetParentId
                  ? "Create a nested collection under the selected parent."
                  : "Fill in the details below to add a new collection to your store."}
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
                  placeholder="Enter slug"
                  value={slug}
                  onPaste={handleSlugPaste}
                  onChange={handleSlugChange}
                />
                <p className="text-gray-400 mt-1 text-xs">
                  Only lowercase letters and hyphens allowed. Spaces, numbers,
                  and other special characters will be removed.
                </p>
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
                  Parent Collection (Optional)
                </label>
                <Select
                  value={parentId || "none"}
                  onValueChange={(value) =>
                    setParentId(value === "none" ? null : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent collection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Top Level)</SelectItem>
                    {parentCollections.map((pc) => (
                      <SelectItem key={pc.id} value={pc.id}>
                        {pc.parent_id ? `↳ ${pc.name}` : pc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">
                  Select a parent to create a sub-collection
                </p>
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
                <Button
                  className="px-6"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                      ? "Update Collection"
                      : "Create Collection"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
