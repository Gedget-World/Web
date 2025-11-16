"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Trash2,
  Image as LucideImage,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { ButtonGroup } from "@/components/ui/button-group";

export default function ProductImages({
  supabase,
  setProductImages,
  productImages,
}: any) {
  const [images, setImages] = useState<
    { image_url: string; image_name: string }[]
  >(productImages || []);

  // Update parent component whenever images state changes
  useEffect(() => {
    setProductImages(images);
  }, [images, setProductImages]);

  // Swap two images in array
  const swapImages = (i: number, j: number) => {
    setImages((prev) => {
      const arr = [...prev];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  };

  // Move left
  const moveLeft = (index: number) => {
    if (index > 0) swapImages(index, index - 1);
  };

  // Move right
  const moveRight = (index: number) => {
    if (index < images.length - 1) swapImages(index, index + 1);
  };

  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  // Delete image
  const deleteImage = async (index: number) => {
    const imageToDelete = images[index];
    if (!imageToDelete) return;

    setIsDeleting(index);

    const productBucket =
      process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_BUCKET || "product_images";

    try {
      // Remove from Supabase storage
      const { error } = await supabase.storage
        .from(productBucket)
        .remove([imageToDelete.image_name]);

      if (error) {
        console.error(`Failed to delete ${imageToDelete.image_name}:`, error);
        alert(`Failed to delete image: ${error.message}`);
        return;
      }

      // Remove from local state only if storage deletion was successful
      setImages((prev) => prev.filter((_, i) => i !== index));

      console.log(`Successfully deleted ${imageToDelete.image_name}`);
    } catch (error) {
      console.error("Delete failed:", error);
      alert(
        `Delete failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    console.log("Selected files:", files);
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const productBucket =
      process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_BUCKET || "product_images";

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Create unique filename with timestamp and random string
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileName = `${timestamp}-${randomString}-${file.name.replace(
          /\s+/g,
          "_"
        )}`;

        console.log(`Uploading file ${index + 1}/${files.length}:`, fileName);

        const { data, error } = await supabase.storage
          .from(productBucket)
          .upload(fileName, file);

        if (error) {
          console.error(`Upload error for ${fileName}:`, error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }

        const { data: publicData } = supabase.storage
          .from(productBucket)
          .getPublicUrl(fileName);

        console.log(`File uploaded successfully:`, publicData);

        return {
          image_url: publicData.publicUrl,
          image_name: fileName,
        };
      });

      // Wait for all uploads to complete
      const uploadedImages = await Promise.all(uploadPromises);

      // Add all uploaded images to state at once
      setImages((prev) => [...prev, ...uploadedImages]);

      console.log(`Successfully uploaded ${uploadedImages.length} images`);
    } catch (error) {
      console.error("Upload failed:", error);
      // You might want to show a toast notification here
      alert(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex gap-4 flex-wrap">
      {images.length === 0 && (
        <div className="flex flex-col items-center justify-center w-full p-4 rounded border border-dashed border-gray-300">
          <div className="w-10 h-10 bg-gray-300 rounded-3xl flex items-center justify-center">
            <LucideImage className="text-gray-600 w-5 h-5" />
          </div>
          <p className="text-sm mt-2 text-gray-500">
            Please add a product image
          </p>
          <p className="text-xs text-gray-400">(You can add multiple images)</p>
        </div>
      )}

      {images.map((img, index) => (
        <div
          key={img.image_name}
          className="relative w-[150px] flex flex-col border border-gray-300 
          items-center justify-center p-2 rounded"
        >
          <Image src={img.image_url} alt="Image" width={100} height={100} />

          {/* Serial Number */}
          <Button
            variant="outline"
            size={"icon-sm"}
            disabled
            className="absolute top-2 left-2 rounded-full cursor-pointer"
          >
            {index + 1}
          </Button>

          <div className="mt-2 flex gap-2">
            <ButtonGroup>
              {/* Left Button */}
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous"
                disabled={index === 0} // Disable for first image
                onClick={() => moveLeft(index)} // Move Left
              >
                <ArrowLeftIcon />
              </Button>

              {/* Right Button */}
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next"
                disabled={index === images.length - 1} // Disable for last image
                onClick={() => moveRight(index)} // Move Right
              >
                <ArrowRightIcon />
              </Button>

              {/* Delete Button */}
              <Button
                variant="destructive"
                size={"icon-sm"}
                className="cursor-pointer"
                onClick={() => deleteImage(index)}
                disabled={isDeleting === index}
              >
                {isDeleting === index ? (
                  <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
                ) : (
                  <Trash2 size={14} />
                )}
              </Button>
            </ButtonGroup>
          </div>
        </div>
      ))}
      <div className="w-full">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          multiple
          onChange={handleFilesSelected}
        />
        <Button
          className="mt-3 w-fit"
          variant={"outline"}
          onClick={handleClick}
          disabled={isUploading}
        >
          <Plus className="w-4 h-4 mr-1" />{" "}
          {isUploading ? "Uploading..." : "Add Product Image"}
        </Button>
      </div>
    </div>
  );
}
