"use client";

import { SignInButton } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/spinner/spinner";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";

/**
 * Hero heading for the marketing page that tailors the primary CTA based on auth state.
 * Uses Convex auth status and Clerk sign-in modal to route visitors appropriately.
 *
 * @returns Marketing hero block with conditional calls to action.
 * @see https://docs.convex.dev/auth/clerk
 * @see https://clerk.com/docs/components/sign-in-button
 */
export const Heading = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="font-bold text-3xl sm:text-5xl md:text-6xl">
        Your Ideas, Documents, & Plans. Unified. Welcome to{" "}
        <span className="underline">Joker Notes</span>
      </h1>
      <h3 className="font-medium text-base sm:text-xl md:text-2xl">
        Joker Notes is the connected workspace where <br />
        better, faster work happens.
      </h3>
      {isLoading && (
        <div className="flex w-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}
      {isAuthenticated && !isLoading && (
        <Button render={<Link href={ROUTES.DOCUMENTS.path} />}>
          Enter Joker Notes
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
      {!isAuthenticated && !isLoading && (
        <SignInButton mode="modal">
          <Button>
            Get Joker Notes free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </SignInButton>
      )}
    </div>
  );
};
