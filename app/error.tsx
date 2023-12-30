"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Displays error page whenever there is an error.
 * This component also has a button that redirects the user back to the documents page.
 * If the user is not logged in, they will be redirected to the login page as the documents page is protected.
 * @returns (React.ReactNode) The error page to display when something goes wrong
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
