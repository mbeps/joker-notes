"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Convex Provider to be used in the global Layout component.
 * This allows the Convex client and Clerk to be managed throughout the entire app.
 * This means that the Convex client and Clerk will be available in all components,
 * giving access to the database and authentication.
 * @param children (React.ReactNode): the rest of the app.
 * @returns (JSX.Element): Convex Provider (with Clerk)
 * @see https://clerk.com/docs/integrations/databases/convex
 */
export const ConvexClientProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
