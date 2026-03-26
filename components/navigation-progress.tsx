"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = useCallback(() => {
    // Clear any existing intervals
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setIsVisible(true);
    setProgress(0);

    // Simulate progress
    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 90) {
        currentProgress = 90;
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setProgress(currentProgress);
    }, 100);
  }, []);

  const completeProgress = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    setProgress(100);

    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  useEffect(() => {
    // Complete progress when route changes
    completeProgress();
  }, [pathname, searchParams, completeProgress]);

  // Intercept link clicks to start progress
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        const isExternal =
          anchor.target === "_blank" ||
          href?.startsWith("http") ||
          href?.startsWith("mailto") ||
          href?.startsWith("tel");
        const isSamePageAnchor = href?.startsWith("#");
        const isCurrentPage = href === pathname;

        if (href && !isExternal && !isSamePageAnchor && !isCurrentPage) {
          startProgress();
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname, startProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-9999 h-1 bg-transparent">
      <div
        className="h-full bg-linear-to-r from-blue-500 via-blue-600 to-blue-500 transition-all duration-200 ease-out shadow-lg shadow-blue-500/50"
        style={{
          width: `${progress}%`,
          boxShadow:
            "0 0 10px rgba(59, 130, 246, 0.7), 0 0 5px rgba(59, 130, 246, 0.5)",
        }}
      />
    </div>
  );
}
