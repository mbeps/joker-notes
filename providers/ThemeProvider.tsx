"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

/**
 * Exposes Next Themes context so the UI can react to system and user selected color schemes.
 * Centralizes theme persistence across the layout via local storage and CSS variables.
 *
 * @param children React subtree that needs theme context.
 * @param props Additional Next Themes configuration such as default theme.
 * @returns Provider that wires theme persistence into the React tree.
 * @see https://ui.shadcn.com/docs/dark-mode/next
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
