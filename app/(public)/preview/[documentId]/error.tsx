"use client";

import { ErrorState } from "@/components/error/error-state";
import { ROUTES } from "@/config/routes";

/**
 * Props passed to the preview error boundary by Next.js App Router.
 */
interface PreviewErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route-level error boundary for public note previews.
 * Catches render or fetch failures for shared notes and guides users back to the homepage.
 *
 * @param props Error details and reset callback provided by Next.js error boundary.
 * @param props.error The error thrown while loading the shared preview.
 * @param props.reset Callback to attempt recovery by re-rendering the preview.
 * @returns Preview error UI with retry action and return to home button.
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function PreviewError({ error, reset }: PreviewErrorProps) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Failed to load preview"
      description="An unexpected error occurred while loading this note preview. Please try again or return home."
      buttonText="Back to home"
      buttonHref={ROUTES.HOME.path}
      imageAlt="Preview error"
    />
  );
}
