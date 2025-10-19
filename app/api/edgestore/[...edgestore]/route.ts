import { initEdgeStore } from "@edgestore/server";
import { createEdgeStoreNextHandler } from "@edgestore/server/adapters/next/app";

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

const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
});

export { handler as GET, handler as POST };

/**
 * Router type exported for generating the strongly typed Edge Store client.
 */
export type EdgeStoreRouter = typeof edgeStoreRouter;
