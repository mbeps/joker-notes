import { getClerkIssuerUrl, MCP_SCOPES } from "@/lib/mcp/auth";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Handles CORS preflight for authorization server metadata requests.
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * RFC 8414 OAuth 2.0 Authorization Server Metadata endpoint (including path insertion).
 * Directs clients (e.g. Google Gemini, Claude) to Clerk OAuth endpoints with PKCE and offline_access.
 *
 * @returns JSON metadata response conforming to RFC 8414.
 */
export async function GET(): Promise<Response> {
  const issuer = getClerkIssuerUrl();

  const metadata = {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    userinfo_endpoint: `${issuer}/oauth/userinfo`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_post",
      "none",
    ],
    scopes_supported: [...MCP_SCOPES],
    code_challenge_methods_supported: ["S256"],
  };

  return Response.json(metadata, {
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
