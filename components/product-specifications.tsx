"use client";

interface Specification {
  title: string;
  description: string;
}

interface ProductSpecificationsProps {
  specifications: Specification[];
}

export function ProductSpecifications({
  specifications,
}: ProductSpecificationsProps) {
  if (
    !specifications ||
    !Array.isArray(specifications) ||
    specifications.length === 0
  ) {
    return (
      <p className="text-xs text-slate-500">No specifications available</p>
    );
  }

  // Filter specs that have at least a title with value
  const validSpecs = specifications.filter(
    (spec) => spec.title && spec.title.trim() !== "",
  );

  if (validSpecs.length === 0) {
    return (
      <p className="text-xs text-slate-500">No specifications available</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <tbody className="divide-y divide-slate-100">
          {validSpecs.map((spec, index) => {
            const hasDescription =
              spec.description && spec.description.trim() !== "";
            return (
              <tr key={index} className="flex flex-col sm:table-row">
                <td
                  className={`py-1 sm:py-2 font-regular text-slate-900 ${
                    hasDescription ? "sm:w-1/3" : "sm:w-full"
                  }`}
                  colSpan={hasDescription ? 1 : 2}
                >
                  {spec.title}
                </td>
                {hasDescription && (
                  <td className="pb-1 sm:py-2 text-slate-600">
                    {spec.description}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
