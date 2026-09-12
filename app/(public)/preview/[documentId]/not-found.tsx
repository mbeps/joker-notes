import { NotFound } from "@/components/not-found/not-found";
import { ROUTES } from "@/config/routes";

/**
 * Dynamic route 404 handler for shared preview notes that do not exist or are unpublished.
 * Directs public viewers back to the home landing page.
 *
 * @returns Not-found UI tailored to shared preview notes.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function PreviewNotFound() {
  return (
    <NotFound
      title="Note not found"
      description="The note you are looking for does not exist or is no longer published."
      buttonText="Back to home"
      buttonHref={ROUTES.HOME.path}
      imageAlt="Note not found"
    />
  );
}
