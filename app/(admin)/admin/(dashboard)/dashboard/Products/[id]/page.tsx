"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Lock, Image as LucideImage } from "lucide-react";
import MultipleImagesHandle from "@/components/admin/multiple-images-handle";
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
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = createClient();
  const { id } = React.use(params);
  const router = useRouter();

  const [editingField, setEditingField] = useState<string | null>(null);

  const [productImages, setProductImages] = useState<
    { image_url: string; image_name: string }[]
  >([]);
  const [InitialProductImages, setInitialProductImages] = useState<
    { image_url: string; image_name: string }[]
  >([]);

  // Product specifications state
  const [productSpecifications, setProductSpecifications] = useState<
    { title: string; description: string }[]
  >([]);

  const [product, setProduct] = useState({
    id: "" as string,
    name: "",
    description: "",
    price: null as number | null,
    discount_percentage: null as number | null,
    stock: null as number | null,
    collection_id: "",
    is_active: null as boolean | null,
    is_featured: null as boolean | null,
    is_new_arrival: null as boolean | null,
    is_out_of_stock: false as boolean,
    slug: "",
    created_at: "",
    image_name: "",
    image_urls: "" as string,
    instagram_url: "" as string,
    youtube_url: "" as string,
  });

  const [collections, setCollections] = useState<
    {
      id: string;
      name: string;
      parent_id: string | null;
      parent: { name: string }[] | null;
    }[]
  >([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const handleChange = (key: string, value: any) => {
    setProduct((prev) => ({ ...prev, [key]: value }));
  };

  // Product specifications handlers
  const handleAddSpecification = () => {
    setProductSpecifications((prev) => [
      ...prev,
      { title: "", description: "" },
    ]);
  };

  const handleRemoveSpecification = (index: number) => {
    setProductSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpecificationChange = (
    index: number,
    field: "title" | "description",
    value: string,
  ) => {
    setProductSpecifications((prev) =>
      prev.map((spec, i) => (i === index ? { ...spec, [field]: value } : spec)),
    );
  };

  // Initial data fetching
  useEffect(() => {
    const fetchProductData = async () => {
      setPageLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error("Error fetching product:", error);
      } else if (data) {
        console.log("Fetched product data:", data);
        setProduct({
          id: data.id,
          name: data.name,
          description: data.description,
          price: data.price,
          discount_percentage: data.discount_percentage,
          stock: data.stock,
          collection_id: data.collection_id,
          is_active: data.is_active,
          is_featured: data.is_featured,
          is_new_arrival: data.is_new_arrival,
          is_out_of_stock: data.is_out_of_stock || false,
          slug: data.slug,
          created_at: data.created_at,
          image_name: data.image_name,
          image_urls: data.image_url,
          instagram_url: data.instagram_url || "",
          youtube_url: data.youtube_url || "",
        });

        // Load specifications from database
        if (data.specifications && Array.isArray(data.specifications)) {
          setProductSpecifications(data.specifications);
        }

        const { data: imagesData, error: imagesError } = await supabase
          .from("product_images")
          .select("*")
          .eq("product_id", id)
          .order("display_order", { ascending: true });
        if (imagesError) {
          console.error("Error fetching product images:", imagesError);
        } else if (imagesData) {
          console.log("Fetched product images:", imagesData);
          const formattedImages = imagesData.map((img) => ({
            image_url: img.image_url,
            image_name: img.image_name,
          }));
          setProductImages(formattedImages);
          setInitialProductImages(formattedImages);
        }
      }
      setPageLoading(false);
    };
    const fetchCollections = async () => {
      setLoadingCollections(true);
      const { data, error } = await supabase
        .from("collections")
        .select("id, name, parent_id, parent:parent_id(name)")
        .order("name");
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
    fetchProductData();
    fetchCollections();
  }, []);

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
  };

  function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (
      typeof a !== "object" ||
      typeof b !== "object" ||
      a === null ||
      b === null
    ) {
      return false;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  const [nameValidationError, setNameValidationError] =
    useState<boolean>(false);
  const [priceValidationError, setPriceValidationError] =
    useState<boolean>(false);
  const [stockValidationError, setStockValidationError] =
    useState<boolean>(false);
  const [collectionValidationError, setCollectionValidationError] =
    useState<boolean>(false);
  const [descriptionValidationError, setDescriptionValidationError] =
    useState<boolean>(false);

  const [ThumbnailImageValidationError, setThumbnailImageValidationError] =
    useState<boolean>(false);
  const [ProductImagesValidationError, setProductImagesValidationError] =
    useState<boolean>(false);
  const [
    productSpecificationsValidationError,
    setProductSpecificationsValidationError,
  ] = useState<boolean>(false);

  const productValidation = () => {
    setNameValidationError(false);
    setProductSpecificationsValidationError(false);
    let res = true;

    if (product.name.trim() === "") {
      setNameValidationError(true);
      res = false;
    } else {
      setNameValidationError(false);
    }

    if (!product.price || product.price <= 0) {
      setPriceValidationError(true);
      res = false;
    } else {
      setPriceValidationError(false);
    }

    if (!product.stock || product.stock <= 0) {
      setStockValidationError(true);
      res = false;
    } else {
      setStockValidationError(false);
    }

    if (product.collection_id.trim() === "") {
      setCollectionValidationError(true);
      res = false;
    } else {
      setCollectionValidationError(false);
    }

    if (product.description.trim() === "") {
      setDescriptionValidationError(true);
      res = false;
    } else {
      setDescriptionValidationError(false);
    }

    if (product.image_urls.trim() === "") {
      setThumbnailImageValidationError(true);
      alert("Please add a thumbnail image.");
      res = false;
    } else {
      setThumbnailImageValidationError(false);
    }

    if (productImages.length === 0) {
      setProductImagesValidationError(true);
      alert("Please add at least one product image.");
      res = false;
    } else {
      setProductImagesValidationError(false);
    }

    // Validate product specifications
    if (productSpecifications.length === 0) {
      setProductSpecificationsValidationError(true);
      alert("Please add at least one product specification.");
      res = false;
    } else {
      // Check if any specification has empty title
      const hasEmptyTitle = productSpecifications.some(
        (spec) => spec.title.trim() === "",
      );

      if (hasEmptyTitle) {
        setProductSpecificationsValidationError(true);
        alert("Please fill in the title for all product specifications.");
        res = false;
      } else {
        setProductSpecificationsValidationError(false);
      }
    }

    return res;
  };

  const [handleSubmitLoading, setHandleSubmitLoading] = useState(false);

  const handleSubmit = async () => {
    // Implement save logic here
    console.log("Submitting product data:", product);
    setHandleSubmitLoading(true);

    // if (!productValidation()) {
    //   console.log("Product data is valid. Proceeding to save...");
    //   setHandleSubmitLoading(false);
    //   return;
    // }

    if (!deepEqual(InitialProductImages, productImages)) {
      console.log("Product images have changed.");

      // First, delete ALL existing product images for this product
      const { data: deleteData, error: deleteError } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", id)
        .select();

      console.log("Delete operation result:", { deleteData, deleteError });

      if (deleteError) {
        console.error("Error deleting old product images:", deleteError);
        alert("There was an error updating product images. Please try again.");
        setHandleSubmitLoading(false);
        return;
      }

      console.log("Deleted images count:", deleteData?.length || 0);

      // Now insert the new images
      const imagesToInsert = productImages.map((img, index) => ({
        product_id: id,
        image_url: img.image_url,
        image_name: img.image_name,
        display_order: index + 1,
      }));

      console.log("Inserting images:", imagesToInsert);

      const { data: imagesData, error: imagesError } = await supabase
        .from("product_images")
        .insert(imagesToInsert)
        .select();

      if (imagesError) {
        console.error("Error adding product images:", imagesError);
        alert("Error adding product images. Please try again.");
        setHandleSubmitLoading(false);
        return;
      }
      console.log("Product images updated successfully:", imagesData);

      setInitialProductImages([...productImages]);
    } else {
      console.log("Product images have not changed.");
    }

    const product_payload = {
      name: product.name,
      description: product.description,
      price: product.price,
      discount_percentage: product.discount_percentage,
      stock: product.stock,
      collection_id: product.collection_id,
      is_active: product.is_active,
      is_featured: product.is_featured,
      is_new_arrival: product.is_new_arrival,
      is_out_of_stock: product.is_out_of_stock,
      image_name: product.image_name,
      image_url: product.image_urls,
      specifications: productSpecifications,
      instagram_url: product.instagram_url,
      youtube_url: product.youtube_url,
    };

    console.log("Updating product with payload:", product_payload);
    const { error } = await supabase
      .from("products")
      .update(product_payload)
      .eq("id", id);

    if (error) {
      console.error("Error updating product:", error);
      alert("There was an error updating the product. Please try again.");
      setHandleSubmitLoading(false);
      return;
    }

    alert("Product updated successfully!");
    router.push("/admin/dashboard/Products");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {pageLoading ? (
        <div className="text-gray-500 w-full h-[500px] flex items-center justify-center">
          <Spinner className="size-8" />
          <p className="ml-3">Loading product details...</p>
        </div>
      ) : (
        <>
          <Card className="border">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center gap-4 justify-between">
                <div>{product.name}</div>

                <div className="flex items-center gap-3">
                  {/* Out of Stock Toggle */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md">
                          <label className="text-sm text-gray-600 whitespace-nowrap">
                            Out of Stock
                          </label>
                          <Switch
                            checked={product.is_out_of_stock}
                            onCheckedChange={async (val) => {
                              handleChange("is_out_of_stock", val);
                              const { error } = await supabase
                                .from("products")
                                .update({ is_out_of_stock: val })
                                .eq("id", id);
                              if (error) {
                                console.error(
                                  "Error updating out of stock status:",
                                  error,
                                );
                                handleChange("is_out_of_stock", !val);
                              }
                            }}
                            className="cursor-pointer"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {product.is_out_of_stock
                            ? "Product is currently out of stock"
                            : "Toggle to mark product as out of stock"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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
                  {product.image_urls === "" ? (
                    <div className="flex flex-col items-center justify-center gap-4 w-full p-4 rounded border border-dashed border-gray-300">
                      <div className="w-10 h-10 bg-gray-300 rounded-3xl flex items-center justify-center">
                        <LucideImage className="text-gray-600 w-5 h-5" />
                      </div>
                      <p className="text-xs text-gray-400">No image added</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {product.image_urls === "" ? null : (
                        <div
                          className="relative w-[150px] flex flex-col border border-gray-300 
                        items-center justify-center p-2 rounded"
                        >
                          <Image
                            src={product?.image_urls}
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
                  {ThumbnailImageValidationError && (
                    <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                      Please add a thumbnail image.
                    </p>
                  )}
                  {/* If image is present, show image preview */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFilesSelected}
                  />
                  {product?.image_urls?.length === 0 && (
                    <Button
                      className="mt-3 w-fit"
                      variant={"outline"}
                      onClick={handleClick}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Image
                    </Button>
                  )}
                </div>
                {/* Product Image Section */}
                <div className="mt-5">
                  <p className="text-left text-gray-500 text-sm mb-2">
                    Product Image
                  </p>

                  <MultipleImagesHandle
                    supabase={supabase}
                    setProductImages={setProductImages}
                    productImages={productImages}
                  />
                  {ProductImagesValidationError && (
                    <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                      Please add at least one product image.
                    </p>
                  )}
                </div>
              </div>

              {/* Editable Product Info */}
              <div className="space-y-4">
                {[
                  {
                    key: "name",
                    label: "Product Name",
                    type: "text",
                    editable: true,
                  },
                  { key: "slug", label: "Slug", type: "text", editable: true },
                  {
                    key: "price",
                    label: "Price ($)",
                    type: "number",
                    editable: true,
                  },
                  {
                    key: "discount_percentage",
                    label: "Discount (%)",
                    type: "number",
                    editable: true,
                  },
                  {
                    key: "stock",
                    label: "Stock",
                    type: "number",
                    editable: true,
                  },
                ].map(({ key, label, type, editable }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="w-full">
                      <label className="block text-sm text-gray-500">
                        {label}
                      </label>
                      {editable ? (
                        <>
                          {editingField === key ? (
                            <>
                              <div className="flex gap-2 items-center">
                                <Input
                                  type={type}
                                  value={
                                    product[key as keyof typeof product] as any
                                  }
                                  onChange={(e) =>
                                    handleChange(
                                      key,
                                      type === "number"
                                        ? parseFloat(e.target.value) || 0
                                        : e.target.value,
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
                            </>
                          ) : (
                            <>
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
                              {key === "name" && nameValidationError ? (
                                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                                  Product name cannot be empty.
                                </p>
                              ) : null}
                              {key === "price" && priceValidationError ? (
                                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                                  Price must be a positive number.
                                </p>
                              ) : null}
                              {key === "stock" && stockValidationError ? (
                                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                                  Stock must be a positive number.
                                </p>
                              ) : null}
                            </>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-base">
                            {product[key as keyof typeof product]}
                          </p>
                          <Button size="icon" variant="ghost">
                            <Lock className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Collection Select */}
                <div>
                  <label className="block text-sm text-gray-500">
                    Collection
                  </label>
                  {editingField === "collection_id" ? (
                    <>
                      <div className="flex gap-2 items-center">
                        <Select
                          value={product.collection_id}
                          onValueChange={(val) =>
                            handleChange("collection_id", val)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Collection" />
                          </SelectTrigger>
                          <SelectContent>
                            {collections.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.parent_id ? `↳ ${c.name}` : c.name}
                                {c.parent?.[0] && (
                                  <span className="text-gray-400 text-xs ml-1">
                                    (in {c.parent[0].name})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-base">
                        {
                          collections.find(
                            (c) => c.id === product.collection_id,
                          )?.name
                        }
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingField("collection_id")}
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </Button>
                    </div>
                  )}
                  {collectionValidationError ? (
                    <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                      Please select a collection.
                    </p>
                  ) : null}
                  {loadingCollections ? (
                    <p className="text-gray-500 text-xs mt-1">
                      Loading collections...
                    </p>
                  ) : null}
                </div>

                {/* Product specifications */}
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Product Specifications
                  </label>
                  <div className="flex flex-col gap-2 mb-2">
                    {productSpecifications.map((spec, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row gap-2 p-3 border border-gray-200 rounded-md"
                      >
                        <Input
                          placeholder="Title (e.g., Material)"
                          value={spec.title}
                          onChange={(e) =>
                            handleSpecificationChange(
                              index,
                              "title",
                              e.target.value,
                            )
                          }
                          className="flex-1"
                        />
                        <Input
                          placeholder="Description (e.g., Cotton)"
                          value={spec.description}
                          onChange={(e) =>
                            handleSpecificationChange(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => handleRemoveSpecification(index)}
                          className="cursor-pointer shrink-0"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSpecification}
                    className="cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Specification
                  </Button>
                  {productSpecificationsValidationError && (
                    <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                      Please add at least one specification with both title and
                      description.
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-gray-500 mb-1">
                    Description
                  </label>
                  {editingField === "description" ? (
                    <>
                      <div className="space-y-2">
                        <Textarea
                          value={product.description}
                          onChange={(e) =>
                            handleChange("description", e.target.value)
                          }
                          placeholder="Enter product description"
                          rows={4}
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
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <p className="text-base max-w-lg">
                          {product.description}
                        </p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingField("description")}
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </Button>
                      </div>
                      {descriptionValidationError ? (
                        <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                          Description cannot be empty.
                        </p>
                      ) : null}
                    </>
                  )}
                </div>

                {/* Instagram and YouTube links */}
                <div>
                  <label className="block text-sm text-gray-500">
                    Instagram URL
                  </label>
                  {editingField === "instagram_url" ? (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="url"
                        value={product.instagram_url}
                        placeholder="https://www.instagram.com/..."
                        onChange={(e) =>
                          handleChange("instagram_url", e.target.value)
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
                      <p className="text-base truncate max-w-xs">
                        {product.instagram_url || "Not set"}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingField("instagram_url")}
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-500">
                    YouTube URL
                  </label>
                  {editingField === "youtube_url" ? (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="url"
                        value={product.youtube_url}
                        placeholder="https://www.youtube.com/..."
                        onChange={(e) =>
                          handleChange("youtube_url", e.target.value)
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
                      <p className="text-base truncate max-w-xs">
                        {product.youtube_url || "Not set"}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingField("youtube_url")}
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
                    { key: "is_new_arrival", label: "New Arrival" },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                    >
                      <label className="text-sm text-gray-600">{label}</label>
                      <Switch
                        checked={
                          product[key as keyof typeof product] as boolean
                        }
                        onCheckedChange={(val) => handleChange(key, val)}
                        className="cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-6 flex justify-end">
                  <Button
                    className="px-6"
                    onClick={handleSubmit}
                    disabled={handleSubmitLoading}
                  >
                    {handleSubmitLoading ? (
                      <>
                        <Spinner className="size-4 mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Save All Changes"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
