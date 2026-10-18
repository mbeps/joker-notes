import { getAuthServerUrl, MCP_SCOPES } from "@/lib/mcp/auth";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Handles CORS preflight for OpenID configuration requests.
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * OpenID Connect Discovery 1.0 endpoint at root /.well-known/openid-configuration.
 * Consumed by AI clients querying standard OIDC metadata (e.g. ChatGPT, Gemini).
 *
 * @param req - Optional inbound Request to infer host origin.
 * @returns JSON metadata response conforming to OpenID Connect Discovery 1.0.
 */
export async function GET(req?: Request): Promise<Response> {
  const issuer = getAuthServerUrl(req);

  const metadata = {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/api/oauth/token`,
    registration_endpoint: `${issuer}/api/oauth/register`,
    userinfo_endpoint: `${issuer}/api/oauth/userinfo`,
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
