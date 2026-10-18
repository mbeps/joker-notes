import type { AuthConfig } from "convex/server";

/**
 * Clerk auth configuration consumed by Convex for verifying user sessions.
 * See https://docs.convex.dev/auth/clerk for linking Convex and Clerk.
 */
const convex: AuthConfig = {
  providers: [
    {
      domain: "https://grateful-glowworm-20.clerk.accounts.dev",
      applicationID: "convex",
    },
    {
      type: "customJwt",
      issuer: "https://grateful-glowworm-20.clerk.accounts.dev",
      jwks: "https://grateful-glowworm-20.clerk.accounts.dev/.well-known/jwks.json",
      algorithm: "RS256",
    },
  ],
};

export default convex;
