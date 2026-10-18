import { getJwks } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Handles CORS preflight for JWKS metadata.
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Public JWKS endpoint exposing active public keys for RS256 token verification.
 *
 * @returns JSON response containing JWKS public keys.
 */
export async function GET(): Promise<Response> {
  const jwks = getJwks();

  return Response.json(jwks, {
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
