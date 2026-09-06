import { NotFound } from "@/components/NotFound/NotFound";
import { ROUTES } from "@/constants/routes";

/**
 * Root 404 handler for Joker Notes.
 * Displayed whenever a user visits an unmatched route across the entire application.
 *
 * @returns Global not-found UI directing the user back to their documents.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function RootNotFound() {
  return (
    <NotFound
      title="Page not found"
      description="The page you are looking for does not exist."
      buttonText="Go back"
      buttonHref={ROUTES.DOCUMENTS.path}
      imageAlt="Page not found"
    />
  );
}
