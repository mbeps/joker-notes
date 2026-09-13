import { DocumentSkeleton } from "@/components/document/document-skeleton";

/**
 * Route-level loading boundary for document detail view.
 * Displayed by Next.js Suspense while the document and its content are being fetched.
 *
 * @returns Document skeleton UI replicating the cover and document layout.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/loading
 */
export default function DocumentLoading() {
  return <DocumentSkeleton />;
}
