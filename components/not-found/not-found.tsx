"use client";

import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { Button } from "@/components/ui/button";
import { ASSETS } from "@/config/assets";
import { ROUTES } from "@/config/routes";
import type { NotFoundProps } from "@/types/not-found/not-found-props";

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
      <Button nativeButton={false} render={<Link href={buttonHref} />}>
        {buttonText}
      </Button>
    </div>
  );
};
