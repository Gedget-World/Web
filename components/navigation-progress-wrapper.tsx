"use client";

import { Suspense } from "react";
import { NavigationProgress } from "./navigation-progress";

// Wrapper to handle Suspense boundary for useSearchParams
export function NavigationProgressWrapper() {
  return (
    <Suspense fallback={null}>
      <NavigationProgress />
    </Suspense>
  );
}
