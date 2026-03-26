"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, type ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // If pathname changed
    if (previousPathname.current !== pathname) {
      setIsTransitioning(true);

      // Short delay for fade out
      const fadeOutTimer = setTimeout(() => {
        setDisplayChildren(children);
        previousPathname.current = pathname;

        // Small delay before fade in
        const fadeInTimer = setTimeout(() => {
          setIsTransitioning(false);
        }, 50);

        return () => clearTimeout(fadeInTimer);
      }, 150);

      return () => clearTimeout(fadeOutTimer);
    } else {
      // Same pathname, just update children
      setDisplayChildren(children);
    }
  }, [children, pathname]);

  return (
    <div
      className={`transition-opacity duration-200 ease-in-out ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
    >
      {displayChildren}
    </div>
  );
}
