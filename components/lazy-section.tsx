"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  fallback?: ReactNode;
}

export function LazySection({
  children,
  className = "",
  threshold = 0.1,
  rootMargin = "100px",
  fallback = null,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, stop observing
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin]);

  return (
    <div ref={sectionRef} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

// Loading placeholder component
export function SectionSkeleton({ height = "400px" }: { height?: string }) {
  return (
    <div
      className="w-full animate-pulse bg-muted/50 rounded-lg"
      style={{ minHeight: height }}
    />
  );
}

// Product card skeleton for lazy loading product grids
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="aspect-square bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-8 bg-slate-200 rounded w-full mt-4" />
      </div>
    </div>
  );
}
