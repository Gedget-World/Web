"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ButtonGroup } from "@/components/ui/button-group";

export default function ProductImages() {
  const [images, setImages] = useState([
    { image_url: "/placeholder.svg", image_name: "img1" },
    { image_url: "/placeholder.svg", image_name: "img2" },
    { image_url: "/placeholder.svg", image_name: "img3" },
  ]);

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

  // Delete image
  const deleteImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex gap-4 flex-wrap">
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
              >
                <Trash2 size={14} />
              </Button>
            </ButtonGroup>
          </div>
        </div>
      ))}
    </div>
  );
}
