"use client";

import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";
import SearchCommand from "@/components/Search/SearchCommand";
import { Spinner } from "@/components/Spinner/Spinner";
import { ROUTES } from "@/constants/routes";
import Navigation from "./_components/Navigation";

/**
 * Authenticated workspace layout that gates all `(main)` routes behind Convex auth.
 * Renders the navigation shell and global search command for signed-in users only.
 * Uses Next.js `redirect` to send anonymous visitors back to marketing.
 * @see https://docs.convex.dev/auth/clerk
 * @see https://nextjs.org/docs/app/building-your-application/routing/redirecting
 */
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // prevents unauthenticated users from accessing any page in `main`
  if (!isAuthenticated) {
    return redirect(ROUTES.HOME.path);
  }

  return (
    <div className="flex h-full dark:bg-[#1F1F1F]">
      <Navigation />
      <main className="h-full flex-1 overflow-y-auto">
        <SearchCommand />
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
