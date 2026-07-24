"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { Input } from "@/components/ui/input";
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
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

export default function CreateProductPage() {
  const supabase = createClient();
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: null as number | null,
    discount_percentage: 0 as number,
    stock: null as number | null,
    monthly_purchase_count: 0 as number,
    image_urls: "" as string,
    image_name: "" as string,
    collection_id: "",
    is_active: true,
    is_featured: false,
    is_new_arrival: false,
    instagramURL: "" as string | null,
    youtubeURL: "" as string | null,
  });

  const [productSpecifications, setProductSpecifications] = useState<
    { title: string; description: string }[]
  >([]);

  useEffect(() => {
    console.log("Current product state:", product);
    console.log("Current product specifications state:", productSpecifications);
  }, [product, productSpecifications]);

  const router = useRouter();

  const [productImages, setProductImages] = useState<
    { image_url: string; image_name: string }[]
  >([]);

  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"checking" | "available" | "taken" | "">(
    "",
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
    [],
  );

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      setSlug("");
      setStatus("");
      return;
    }
    const newSlug = e.target.value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces (including multiple) with single dash
      .replace(/[^a-z0-9-]/g, "") // Remove all characters except lowercase letters, numbers, and dashes
      .replace(/-+/g, "-") // Replace multiple consecutive dashes with single dash
      .replace(/^-|-$/g, "");
    setSlug(newSlug);
    checkSlug(newSlug);
  };

  const [collections, setCollections] = useState<
    {
      id: string;
      name: string;
      parent_id: string | null;
      parent: { name: string }[] | null;
    }[]
  >([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [handleSubmitLoading, setHandleSubmitLoading] = useState(false);

  // Initial page load
  useEffect(() => {
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
    // console.log("ENV VAR:", process.env.NEXT_PUBLIC_SUPABASE_THUMBNAIL_BUCKET);
    // console.log("ENV VAR:", process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_BUCKET);
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (key: string, value: any) => {
    setProduct((prev) => ({ ...prev, [key]: value }));
  };

  const [nameValidationError, setNameValidationError] =
    useState<boolean>(false);
  const [slugValidationError, setSlugValidationError] =
    useState<boolean>(false);
  const [priceValidationError, setPriceValidationError] =
    useState<boolean>(false);
  const [stockValidationError, setStockValidationError] =
    useState<boolean>(false);
  const [collectionValidationError, setCollectionValidationError] =
    useState<boolean>(false);
  const [descriptionValidationError, setDescriptionValidationError] =
    useState<boolean>(false);

  const [
    productSpecificationsValidationError,
    setProductSpecificationsValidationError,
  ] = useState<boolean>(false);

  const [ThumbnailImageValidationError, setThumbnailImageValidationError] =
    useState<boolean>(false);
  const [ProductImagesValidationError, setProductImagesValidationError] =
    useState<boolean>(false);

  const productValidation = () => {
    setNameValidationError(false);
    setSlugValidationError(false);
    setPriceValidationError(false);
    setStockValidationError(false);
    setCollectionValidationError(false);
    setDescriptionValidationError(false);
    setThumbnailImageValidationError(false);
    setProductImagesValidationError(false);
    setProductSpecificationsValidationError(false);
    let res = true;

    if (product.name.trim() === "") {
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

  const handleSubmit = async () => {
    console.log("Creating product:", product);
    setHandleSubmitLoading(true);

    if (productValidation()) {
      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            name: product.name,
            slug: slug,
            description: product.description,
            price: product.price,
            image_url: product.image_urls,
            collection_id: product.collection_id,
            is_featured: product.is_featured,
            stock: product.stock,
            discount_percentage: product.discount_percentage,
            sales_count: 0,
            monthly_purchase_count: product.monthly_purchase_count,
            is_new_arrival: product.is_new_arrival,
            is_active: product.is_active,
            image_name: product.image_name,
            instagram_url: product.instagramURL,
            youtube_url: product.youtubeURL,
            specifications: productSpecifications,
          },
        ])
        .select();
      if (error) {
        console.error("Error creating product:", error);
        alert("Error creating product. Please try again.");
        setHandleSubmitLoading(false);
        return;
      }
      console.log("Product created successfully:", data);
      if (data && data.length > 0) {
        const productId = data[0].id;
        const imagesToInsert = productImages.map((img, index) => ({
          product_id: productId,
          image_url: img.image_url,
          image_name: img.image_name,
          display_order: index + 1,
        }));
        const { data: imagesData, error: imagesError } = await supabase
          .from("product_images")
          .insert(imagesToInsert);
        if (imagesError) {
          console.error("Error adding product images:", imagesError);
          alert("Error adding product images. Please try again.");
          setHandleSubmitLoading(false);
          return;
        }
        console.log("Product images added successfully:", imagesData);
        router.push("/admin/dashboard/Products");
      }
    } else {
      setHandleSubmitLoading(false);
    }
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
                    <div
                      className="relative w-[150px] flex flex-col border border-gray-300 
          items-center justify-center p-2 rounded"
                    >
                      <Image
                        src={product.image_urls}
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
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFilesSelected}
              />
              {product.image_urls === "" && (
                <Button
                  className="mt-3 w-fit"
                  variant="outline"
                  onClick={handleClick}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Thumbnail Image
                </Button>
              )}
              {ThumbnailImageValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  Please add a thumbnail image.
                </p>
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
                productImages={[]}
              />
              {ProductImagesValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  Please add at least one product image.
                </p>
              )}
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
              {nameValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  This email is invalid.
                </p>
              )}
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
              {slugValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  Please provide a valid and unique slug.
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
                  value={product.price || ""}
                  placeholder="Enter Price here"
                  onChange={(e) =>
                    handleChange("price", parseFloat(e.target.value) || 0)
                  }
                />
                {priceValidationError && (
                  <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                    Please provide a valid price greater than 0.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Discount (%)
                </label>
                <Input
                  type="number"
                  placeholder="Enter discount if needed"
                  value={product.discount_percentage || ""}
                  onChange={(e) =>
                    handleChange(
                      "discount_percentage",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                />
              </div>
            </div>

            {product.price ? (
              <div className="flex items-center align-middle">
                <span className="text-sm font-regular text-slate-900">
                  &#8377;{product.price}{" "}
                  {product.discount_percentage &&
                    product.discount_percentage > 0 && (
                      <span className="line-through text-slate-500 text-xs">
                        &#8377;
                        {Math.round(
                          product.price /
                            (1 - product.discount_percentage / 100),
                        )}
                      </span>
                    )}
                </span>
                {product.discount_percentage &&
                  product.discount_percentage > 0 && (
                    <div className="text-sm bg-green-600 text-white inline-block py-0 px-1 border border-green-600 rounded-md ml-1">
                      {`${product.discount_percentage} %`}
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">
                No price entered
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Maximum items allowed per customer in the cart
              </label>
              <Input
                type="number"
                value={product.stock || ""}
                placeholder="Enter stock quantity (>0)"
                onChange={(e) =>
                  handleChange("stock", parseInt(e.target.value) || 0)
                }
              />
              {stockValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  Please provide a valid stock quantity greater than 0.
                </p>
              )}
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
              {loadingCollections && (
                <p className="text-gray-500 text-xs mt-1">
                  Loading collections...
                </p>
              )}
              {collectionValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  Please select a collection.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Product Specifications
              </label>
              <div className="flex flex-col gap-2 mb-2">
                {productSpecifications.map((spec, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Title"
                      value={spec.title}
                      onChange={(e) => {
                        const newSpecs = [...productSpecifications];
                        newSpecs[index].title = e.target.value;
                        setProductSpecifications(newSpecs);
                      }}
                    />
                    <Input
                      placeholder="Description"
                      value={spec.description}
                      onChange={(e) => {
                        const newSpecs = [...productSpecifications];
                        newSpecs[index].description = e.target.value;
                        setProductSpecifications(newSpecs);
                      }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="cursor-pointer"
                      onClick={() => {
                        const newSpecs = [...productSpecifications];
                        newSpecs.splice(index, 1);
                        setProductSpecifications(newSpecs);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                <div>
                  <Button
                    type="button"
                    className="cursor-pointer mt-3"
                    size={"sm"}
                    onClick={() =>
                      setProductSpecifications([
                        ...productSpecifications,
                        { title: "", description: "" },
                      ])
                    }
                  >
                    Add Specification
                  </Button>
                </div>
              </div>
              {productSpecificationsValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  Please provide a product Specifications.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Description
              </label>
              <Textarea
                placeholder="Enter product description"
                value={product.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
              />
              {descriptionValidationError && (
                <p className="text-red-500 mt-1 font-semibold peer-aria-invalid:text-destructive text-xs">
                  Please provide a product description.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Monthly Purchase Count
              </label>
              <Input
                type="number"
                min={0}
                value={product.monthly_purchase_count}
                placeholder="Enter monthly purchase count"
                onChange={(e) =>
                  handleChange(
                    "monthly_purchase_count",
                    parseInt(e.target.value) || 0,
                  )
                }
              />
              <p className="text-sm text-gray-500 mt-1">
                {product.monthly_purchase_count}k+ bought this month
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Instagram Short URL
              </label>
              <Input
                placeholder="URL"
                onChange={(e) =>
                  setProduct({ ...product, instagramURL: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Youtube Video URL
              </label>
              <Input
                placeholder="URL"
                onChange={(e) =>
                  setProduct({ ...product, youtubeURL: e.target.value })
                }
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
              <Button
                className="px-6"
                onClick={handleSubmit}
                disabled={handleSubmitLoading}
              >
                {handleSubmitLoading ? (
                  <>
                    <Spinner className="size-4 mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Product"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
