import { cn } from "@/lib/utils";

interface BrandNameProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function BrandName({ size = "md", className }: BrandNameProps) {
  const sizeClasses = {
    xs: "text-xs sm:text-sm",
    sm: "text-sm sm:text-base",
    md: "text-base sm:text-lg",
    lg: "text-lg sm:text-2xl",
  };

  return (
    <span
      className={cn(
        "font-bold select-none inline-flex items-baseline gap-1.5",
        sizeClasses[size],
        className,
      )}
    >
      {/* Gadgets - Bold primary */}
      <span className="text-slate-900 tracking-tight">Gadgets</span>

      {/* Kabila - Subtle accent */}
      <span className="text-slate-500 font-medium italic tracking-normal">
        kabila
      </span>
    </span>
  );
}
