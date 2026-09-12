import { NotFound } from "@/components/not-found/not-found";
import { ROUTES } from "@/config/routes";

/**
 * Dynamic route 404 handler for missing or deleted documents.
 * Renders within the authenticated workspace layout, preserving sidebar navigation
 * and allowing users to return cleanly to their notes.
 *
 * @returns Not-found UI tailored to missing documents.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function DocumentNotFound() {
  return (
    <NotFound
      title="Document not found"
      description="The document you are looking for does not exist or has been deleted."
      buttonText="Back to documents"
      buttonHref={ROUTES.DOCUMENTS.path}
      imageAlt="Document not found"
    />
  );
}
