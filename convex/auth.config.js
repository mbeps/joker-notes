// const issuerURL = process.env.ISSUER_URL

/**
 * Clerk auth configuration consumed by Convex for verifying user sessions.
 * See https://docs.convex.dev/auth/clerk for linking Convex and Clerk.
 */
const convex = {
  providers: [
    {
      domain: "https://grateful-glowworm-20.clerk.accounts.dev",
      applicationID: "convex",
    },
    {
      type: "customJwt",
      issuer: "https://grateful-glowworm-20.clerk.accounts.dev",
      jwksUri:
        "https://grateful-glowworm-20.clerk.accounts.dev/.well-known/jwks.json",
    },
  ],
};

export default convex;
