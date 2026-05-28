"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      forcedTheme="light"
      defaultTheme="light"
      enableSystem={false}
      attribute="class"
    >
      {children}
    </NextThemesProvider>
  );
}
