"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Global event for triggering navigation progress
export const triggerNavigationProgress = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("startNavigationProgress"));
  }
};

// Maximum time before force-completing progress (prevents stuck state)
const MAX_PROGRESS_DURATION = 8000;

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isNavigatingRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
  }, []);

  const completeProgress = useCallback(() => {
    clearAllTimers();
    isNavigatingRef.current = false;

    setProgress(100);

    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 300);
  }, [clearAllTimers]);

  const startProgress = useCallback(() => {
    // Prevent multiple starts
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    clearAllTimers();

    setIsVisible(true);
    setProgress(0);

    // Simulate progress
    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 12;
      if (currentProgress >= 90) {
        currentProgress = 90;
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setProgress(currentProgress);
    }, 150);

    // Force complete after max duration to prevent stuck state
    maxTimeoutRef.current = setTimeout(() => {
      completeProgress();
    }, MAX_PROGRESS_DURATION);
  }, [clearAllTimers, completeProgress]);

  useEffect(() => {
    // Complete progress when route changes (only if we were navigating)
    if (isNavigatingRef.current) {
      completeProgress();
    }
  }, [pathname, searchParams, completeProgress]);

  // Listen for custom navigation progress event (for router.push)
  useEffect(() => {
    const handleStartProgress = () => {
      isNavigatingRef.current = false; // Reset so startProgress can run
      startProgress();
    };

    window.addEventListener("startNavigationProgress", handleStartProgress);
    return () => {
      window.removeEventListener(
        "startNavigationProgress",
        handleStartProgress,
      );
    };
  }, [startProgress]);

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
        const isDownload = anchor.hasAttribute("download");

        // Check if it's the current page (including search params)
        const currentUrl =
          pathname +
          (searchParams.toString() ? `?${searchParams.toString()}` : "");
        const isCurrentPage = href === pathname || href === currentUrl;

        if (
          href &&
          !isExternal &&
          !isSamePageAnchor &&
          !isCurrentPage &&
          !isDownload
        ) {
          isNavigatingRef.current = false; // Reset so startProgress can run
          startProgress();
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname, searchParams, startProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

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
