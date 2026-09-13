"use client";

import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ASSETS } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import type { ErrorStateProps } from "@/types/error/error-state-props";

/**
 * Reusable error boundary presentation component.
 * Displays error imagery, title, description, and action controls (retry and navigation).
 * Logs runtime errors to the console for debugging and telemetry.
 *
 * @param props Configuration options, action callbacks, and error details.
 * @returns Centered error state layout with responsive imagery and action controls.
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  reset,
  title = "Something went wrong!",
  description,
  buttonText = "Go back",
  buttonHref = ROUTES.DOCUMENTS.path,
  imageAlt = "Error",
  retryText = "Try again",
}) => {
  useEffect(() => {
    if (error) {
      console.error("Application error:", error);
    }
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <Image
        src={ASSETS.ERROR.LIGHT}
        height="300"
        width="300"
        alt={imageAlt}
        className="dark:hidden"
      />
      <Image
        src={ASSETS.ERROR.DARK}
        height="300"
        width="300"
        alt={imageAlt}
        className="hidden dark:block"
      />
      <h2 className="font-medium text-xl">{title}</h2>
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
      <div className="flex items-center gap-x-2">
        {reset ? <Button onClick={reset}>{retryText}</Button> : null}
        {buttonHref && buttonText ? (
          <Button
            nativeButton={false}
            variant={reset ? "outline" : "default"}
            render={<Link href={buttonHref} />}
          >
            {buttonText}
          </Button>
        ) : null}
      </div>
    </div>
  );
};
