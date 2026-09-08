import { initEdgeStore } from "@edgestore/server";
import { createEdgeStoreNextHandler } from "@edgestore/server/adapters/next/app";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Initialize EdgeStore server router with validated server environment
const es = initEdgeStore.create();

/**
 * Edge Store router that manages public file uploads and deletes.
 *
 * @returns Router configuration for Edge Store buckets.
 * @see https://docs.edgestore.dev/usage/next
 */
const edgeStoreRouter = es.router({
  publicFiles: es.fileBucket().beforeDelete(() => {
    return true;
  }),
});

let cachedHandler: ReturnType<typeof createEdgeStoreNextHandler> | null = null;

/**
 * Lazily instantiates and caches the Edge Store Next.js request handler.
 *
 * @returns The cached Edge Store request handler.
 */
function getHandler() {
  if (!cachedHandler) {
    cachedHandler = createEdgeStoreNextHandler({
      router: edgeStoreRouter,
    });
  }
  return cachedHandler;
}

/**
 * Next.js route handler routing incoming requests to Edge Store.
 *
 * @param req Incoming Next.js request.
 * @returns Response from Edge Store handler.
 */
const handler = (req: NextRequest) => getHandler()(req);

export { handler as GET, handler as POST };

/**
 * Router type exported for generating the strongly typed Edge Store client.
 */
export type EdgeStoreRouter = typeof edgeStoreRouter;
