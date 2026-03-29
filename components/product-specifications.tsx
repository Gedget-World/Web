"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Specification {
  title: string;
  description: string;
}

interface ProductSpecificationsProps {
  specifications: Specification[];
}

const INITIAL_DISPLAY_COUNT = 5;

export function ProductSpecifications({
  specifications,
}: ProductSpecificationsProps) {
  const [showAll, setShowAll] = useState(false);

  if (
    !specifications ||
    !Array.isArray(specifications) ||
    specifications.length === 0
  ) {
    return (
      <p className="text-xs text-slate-500">No specifications available</p>
    );
  }

  const displayedSpecs = showAll
    ? specifications
    : specifications.slice(0, INITIAL_DISPLAY_COUNT);

  const hasMore = specifications.length > INITIAL_DISPLAY_COUNT;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <tbody className="divide-y divide-slate-100">
          {displayedSpecs.map((spec, index) => (
            <tr key={index} className="flex flex-col sm:table-row">
              <td className="py-1 sm:py-2 font-medium text-slate-900 sm:w-1/3">
                {spec.title}
              </td>
              <td className="pb-1 sm:py-2 text-slate-600">
                {spec.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasMore && (
        <div className="flex justify-center mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Load More ({specifications.length - INITIAL_DISPLAY_COUNT} more)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
