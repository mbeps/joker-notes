"use client";

import { Spinner } from "@/components/Spinner/Spinner";
import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";
import Navigation from "./_components/Navigation";
import SearchCommand from "@/components/Search/SearchCommand";

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
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // prevents unauthenticated users from accessing any page in `main`
  if (!isAuthenticated) {
    return redirect("/");
  }

  return (
    <div className="h-full flex dark:bg-[#1F1F1F]">
      <Navigation />
      <main className="flex-1 h-full overflow-y-auto">
        <SearchCommand />
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
