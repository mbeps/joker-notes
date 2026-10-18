import {
  getClerkIssuerUrl,
  getMcpResourceUrl,
  MCP_SCOPES,
} from "@/lib/mcp/auth";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Handles CORS preflight for protected resource metadata requests.
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * RFC 9728 OAuth 2.0 Protected Resource Metadata endpoint.
 * Exposes canonical resource URL, Clerk authorization server, and scopes.
 *
 * @param req - Inbound HTTP Request.
 * @returns JSON metadata response conforming to RFC 9728.
 */
export async function GET(req: Request): Promise<Response> {
  const metadata = {
    resource: getMcpResourceUrl(req),
    authorization_servers: [getClerkIssuerUrl()],
    scopes_supported: [...MCP_SCOPES],
    bearer_methods_supported: ["header"],
  };

  return Response.json(metadata, {
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
