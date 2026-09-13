import { DocumentSkeleton } from "@/components/document/document-skeleton";

/**
 * Route-level loading boundary for shared public note preview.
 * Rendered by Next.js Suspense while the public document loads.
 *
 * @returns Document skeleton UI replicating the cover and document layout.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function PreviewLoading() {
  return <DocumentSkeleton />;
}
