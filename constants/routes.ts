const DOCUMENTS_BASE = "/documents";
const PREVIEW_BASE = "/preview";

/**
 * Centralised route registry for Joker Notes.
 * Serves as the single source of truth for static paths and dynamic URL generators.
 */
export const ROUTES = {
  HOME: {
    path: "/",
  },
  DOCUMENTS: {
    path: DOCUMENTS_BASE,
    detail: (id: string) => `${DOCUMENTS_BASE}/${id}`,
  },
  PREVIEW: {
    path: PREVIEW_BASE,
    detail: (id: string) => `${PREVIEW_BASE}/${id}`,
  },
} as const;

export type Routes = typeof ROUTES;
