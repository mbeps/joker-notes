"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import type React from "react";
import { Spinner } from "@/components/Spinner/Spinner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ROUTES } from "@/constants/routes";
import { useScrollTop } from "@/hooks/useScrollTop";
import { cn } from "@/lib/utils";
import Logo from "./Logo";

/**
 * Sticky marketing navbar that exposes auth CTAs, theme toggle, and scroll shadow.
 * Reacts to Convex auth state to swap between sign-up prompts and document access links.
 *
 * @returns Marketing navbar containing theme, auth, and scroll-aware styling.
 * @see https://docs.convex.dev/auth/clerk
 * @see https://clerk.com/docs/components/user-button
 */
const Navbar: React.FC = () => {
  /**
   * Applies a shadow once the visitor scrolls past the hero to improve contrast.
   */
  const scrolled = useScrollTop();
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <div
      className={cn(
        "fixed top-0 z-50 flex w-full items-center bg-background p-6 dark:bg-[#1F1F1F]",
        scrolled && "border-b shadow-xs",
      )}
    >
      <Logo />
      <div className="flex w-full items-center justify-between gap-x-2 md:ml-auto md:justify-end">
        {isLoading && <Spinner />}
        {!isAuthenticated && !isLoading && (
          <>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </SignInButton>
            <SignInButton mode="modal">
              <Button size="sm">Get Joker Notes free</Button>
            </SignInButton>
          </>
        )}
        {isAuthenticated && !isLoading && (
          <>
            <Button
              variant="ghost"
              size="sm"
              render={<Link href={ROUTES.DOCUMENTS.path} />}
            >
              Enter Joker Notes
            </Button>
            <UserButton />
          </>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Navbar;
