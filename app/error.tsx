"use client";

import { ErrorState } from "@/components/error/error-state";
import { ROUTES } from "@/config/routes";

/**
 * Props provided by Next.js App Router to error boundary components.
 */
interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root error boundary for Joker Notes.
 * Catches uncaught runtime errors across the application and provides retry/navigation options.
 *
 * @param props Error details and reset callback provided by Next.js error boundary.
 * @param props.error The error instance thrown.
 * @param props.reset Callback to attempt recovery by re-rendering the segment.
 * @returns Global error UI inviting users to retry or return to their documents.
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function RootError({ error, reset }: RootErrorProps) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Something went wrong!"
      description="An unexpected error occurred. Please try again or return to your documents."
      buttonText="Go back"
      buttonHref={ROUTES.DOCUMENTS.path}
      imageAlt="Error"
    />
  );
}
