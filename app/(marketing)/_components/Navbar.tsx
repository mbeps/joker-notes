"use client";

import { Spinner } from "@/components/Spinner/Spinner";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useScrollTop } from "@/hooks/useScrollTop";
import { cn } from "@/lib/utils";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import React from "react";
import Logo from "./Logo";

/**
 * Navbar component specific to the marketing page.
 * This component allows the user to sign in, sign up, and toggle the theme.
 * @returns (React.FC): Navbar component
 */
const Navbar: React.FC = () => {
  /**
   * Checks if the user has scrolled down the page.
   * This is used to add a border to the navbar.
   */
  const scrolled = useScrollTop();
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <div
      className={cn(
        "z-50 bg-background dark:bg-[#1F1F1F] fixed top-0 flex items-center w-full p-6",
        scrolled && "border-b shadow-sm",
      )}
    >
      <Logo />
      <div
        className="
          md:ml-auto 
          md:justify-end justify-between 
          w-full 
          flex 
          items-center 
          gap-x-2"
      >
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
            <Button variant="ghost" size="sm" asChild>
              <Link href="/documents">Enter Joker Notes</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Navbar;