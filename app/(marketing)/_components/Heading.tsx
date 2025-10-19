"use client";

import { Spinner } from "@/components/Spinner/Spinner";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * Heading component for the marketing page.
 * This component is used to display the main heading and CTA.
 * The button is conditionally rendered depending on the user's authentication state.
 * @returns (React.FC): Heading component
 */
export const Heading = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold">
        Your Ideas, Documents, & Plans. Unified. Welcome to{" "}
        <span className="underline">Joker Notes</span>
      </h1>
      <h3 className="text-base sm:text-xl md:text-2xl font-medium">
        Joker Notes is the connected workspace where <br />
        better, faster work happens.
      </h3>
      {isLoading && (
        <div className="w-full flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}
      {isAuthenticated && !isLoading && (
        <Button asChild>
          <Link href="/documents">
            Enter Joker Notes
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      )}
      {!isAuthenticated && !isLoading && (
        <SignInButton mode="modal">
          <Button>
            Get Joker Notes free
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </SignInButton>
      )}
    </div>
  );
};