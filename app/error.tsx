"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ASSETS } from "@/config/assets";
import { ROUTES } from "@/config/routes";

/**
 * Client error boundary UI that invites users to retry by returning to documents.
 * Follows the Next.js app router error handling contract.
 *
 * @returns Error state layout encouraging navigation back to documents.
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
const RootError = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <Image
        src={ASSETS.ERROR.LIGHT}
        height="300"
        width="300"
        alt="Error"
        className="dark:hidden"
      />
      <Image
        src={ASSETS.ERROR.DARK}
        height="300"
        width="300"
        alt="Error"
        className="hidden dark:block"
      />
      <h2 className="font-medium text-xl">Something went wrong!</h2>
      <Button render={<Link href={ROUTES.DOCUMENTS.path} />}>Go back</Button>
    </div>
  );
};

export default RootError;
