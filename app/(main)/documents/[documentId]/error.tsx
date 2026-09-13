"use client";

import { ErrorState } from "@/components/error/error-state";
import { ROUTES } from "@/config/routes";

/**
 * Props passed to the document error boundary by Next.js App Router.
 */
interface DocumentErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary for authenticated document views.
 * Preserves the workspace sidebar while providing recovery actions for document failure.
 *
 * @param props Error details and reset callback provided by Next.js error boundary.
 * @param props.error The error thrown while fetching or editing the document.
 * @param props.reset Callback to attempt recovery by re-rendering the document.
 * @returns Document error UI with retry action and return to documents button.
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function DocumentError({ error, reset }: DocumentErrorProps) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Failed to load document"
      description="An unexpected error occurred while loading this note. Please try again or go back."
      buttonText="Back to documents"
      buttonHref={ROUTES.DOCUMENTS.path}
      imageAlt="Document error"
    />
  );
}
