"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";
import { clientEnv } from "@/lib/env";

const convex = new ConvexReactClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

/**
 * Wraps the React tree with Clerk and Convex providers so queries and mutations share auth context.
 * Enables client components to call Convex APIs that are scoped to the signed-in Clerk user.
 *
 * @param children React subtree needing authenticated Convex access.
 * @returns Providers that hydrate Clerk and Convex contexts.
 * @see https://docs.convex.dev/quickstart/nextjs
 * @see https://clerk.com/docs/nextjs
 */
export const ConvexClientProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ClerkProvider publishableKey={clientEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
