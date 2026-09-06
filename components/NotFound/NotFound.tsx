"use client";

import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

/**
 * Props for the NotFound presentation component.
 */
export interface NotFoundProps {
  /**
   * Primary headline displayed to the user.
   * @default "Page not found"
   */
  title?: string;
  /**
   * Explanatory text beneath the headline.
   * @default "The page you are looking for does not exist."
   */
  description?: string;
  /**
   * Action button text.
   * @default "Go back"
   */
  buttonText?: string;
  /**
   * Centralised route target navigated to on button click.
   * @default ROUTES.DOCUMENTS.path
   */
  buttonHref?: string;
  /**
   * Accessible description for the error imagery.
   * @default "Not found"
   */
  imageAlt?: string;
}

/**
 * Reusable not-found state component styled consistently with error and empty states.
 * Renders light and dark mode illustrations, user-friendly messaging, and a CTA button
 * using centralised route definitions.
 *
 * @param props Configuration options for the not-found screen.
 * @returns Centered not-found layout with responsive imagery and action button.
 */
export const NotFound: React.FC<NotFoundProps> = ({
  title = "Page not found",
  description = "The page you are looking for does not exist.",
  buttonText = "Go back",
  buttonHref = ROUTES.DOCUMENTS.path,
  imageAlt = "Not found",
}) => {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <Image
        src="/error/error-light.png"
        height="300"
        width="300"
        alt={imageAlt}
        className="dark:hidden"
      />
      <Image
        src="/error/error-dark.png"
        height="300"
        width="300"
        alt={imageAlt}
        className="hidden dark:block"
      />
      <h2 className="font-medium text-xl">{title}</h2>
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
      <Button nativeButton={false} render={<Link href={buttonHref} />}>
        {buttonText}
      </Button>
    </div>
  );
};

export default NotFound;
