"use client";

import { type EdgeStoreRouter } from "../app/api/edgestore/[...edgestore]/route";
import { createEdgeStoreProvider } from "@edgestore/react";

/**
 * Configures Edge Store bindings so components can read and mutate uploads within Next.js.
 * Keeps router types in sync with the HTTP handler defined under `app/api/edgestore`.
 *
 * @returns Provider and hook wired to the generated Edge Store router.
 * @see https://docs.edgestore.dev
 */
const { EdgeStoreProvider, useEdgeStore } =
  createEdgeStoreProvider<EdgeStoreRouter>();

export { EdgeStoreProvider, useEdgeStore };
