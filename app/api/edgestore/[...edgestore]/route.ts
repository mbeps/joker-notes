import { initEdgeStore } from "@edgestore/server";
import { createEdgeStoreNextHandler } from "@edgestore/server/adapters/next/app";
import type { NextRequest } from "next/server";
import { getLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const log = getLogger(["app", "api", "edgestore"]);

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
 * Next.js route handler routing incoming requests to Edge Store with telemetry.
 *
 * @param req Incoming Next.js request.
 * @returns Response from Edge Store handler.
 */
const handler = async (req: NextRequest) => {
  log.debug("Received {method} request at '{path}'", {
    method: req.method,
    path: req.nextUrl.pathname,
  });

  try {
    const response = await getHandler()(req);
    return response;
  } catch (err) {
    log.error("Edge Store handler error on {method} '{path}': {error}", {
      method: req.method,
      path: req.nextUrl.pathname,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
};

export { handler as GET, handler as POST };

/**
 * Router type exported for generating the strongly typed Edge Store client.
 */
export type EdgeStoreRouter = typeof edgeStoreRouter;
