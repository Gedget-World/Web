"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Collection = {
  name: string;
  slug: string;
};

export function CollectionsBar({ collections }: { collections: Collection[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (collections.length === 0) return null;

  return (
    <div className="relative w-full bg-slate-900">
      {showLeftButton && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full rounded-none bg-slate-800/80 hover:bg-slate-800 text-white"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex justify-center gap-4 py-1 px-8 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {collections.map((collection) => (
          <Link
            key={collection.slug}
            href={`/products?collection=${collection.slug}`}
            className="text-white font-regular text-sm whitespace-nowrap hover:text-amber-400 transition-colors"
          >
            {collection.name}
          </Link>
        ))}
      </div>

      {showRightButton && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full rounded-none bg-slate-800/80 hover:bg-slate-800 text-white"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
