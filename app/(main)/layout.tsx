"use client";

import { Spinner } from "@/components/Spinner/Spinner";
import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";
import Navigation from "./_components/Navigation";
import SearchCommand from "@/components/Search/SearchCommand";

/**
 * Layout component that applies to all pages within the `(main)` directory.
 * The providers from the root layout component are inherited by this component.
 * The structure of the layout is overwritten.
 *
 * All the pages in the `(main)` directory are protected by authentication.
 * All the pages in the `(main)` directory are rendered within the `Navigation` component.
 *
 * @protected Only authenticated users can access the pages in the `(main)` directory.
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
