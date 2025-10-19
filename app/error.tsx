"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Client error boundary UI that invites users to retry by returning to documents.
 * Follows the Next.js app router error handling contract.
 *
 * @returns Error state layout encouraging navigation back to documents.
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
const Error = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <Image
        src="/error/error-light.png"
        height="300"
        width="300"
        alt="Error"
        className="dark:hidden"
      />
      <Image
        src="/error/error-dark.png"
        height="300"
        width="300"
        alt="Error"
        className="hidden dark:block"
      />
      <h2 className="text-xl font-medium">Something went wrong!</h2>
      <Button asChild>
        <Link href="/documents">Go back</Link>
      </Button>
    </div>
  );
};

export default Error;
