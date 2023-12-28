"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

/**
 * Theme Provider to be used in the global Layout component.
 * This allows the theme to be managed throughout the entire app.
 * @param children (React.ReactNode) - the rest of the app.
 * @returns (JSX.Element) - Theme Provider
 * @see https://ui.shadcn.com/docs/dark-mode/next
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
