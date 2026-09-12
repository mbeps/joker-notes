/**
 * Centralised asset paths for images, logos, and illustrations.
 */
export const ASSETS = {
  LOGOS: {
    LIGHT: "/logos/logo-light.svg",
    DARK: "/logos/logo-dark.svg",
  },
  DOCUMENTS: {
    LIGHT: "/documents/documents-light.png",
    DARK: "/documents/documents-dark.png",
  },
  READING: {
    LIGHT: "/reading/reading-light.png",
    DARK: "/reading/reading-dark.png",
  },
  EMPTY: {
    LIGHT: "/empty/empty-light.png",
    DARK: "/empty/empty-dark.png",
  },
  ERROR: {
    LIGHT: "/error/error-light.png",
    DARK: "/error/error-dark.png",
  },
} as const;

export type Assets = typeof ASSETS;
