import { verifyAccessToken } from "@/lib/mcp/oauth";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Handles CORS preflight for UserInfo requests.
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * OpenID Connect UserInfo endpoint.
 * Returns basic claims for the authenticated user subject.
 *
 * @param req - Inbound UserInfo GET request with Bearer authorization.
 * @returns JSON user claims conforming to OIDC Core 1.0.
 */
export async function GET(req: Request): Promise<Response> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json(
      {
        error: "invalid_token",
        error_description: "Missing or malformed Authorization header",
      },
      {
        status: 401,
        headers: {
          ...CORS_HEADERS,
          "WWW-Authenticate": 'Bearer error="invalid_token"',
        },
      },
    );
  }

  const token = authHeader.slice(7).trim();
  const payload = verifyAccessToken(token);

  if (!payload) {
    return Response.json(
      {
        error: "invalid_token",
        error_description: "Invalid or expired access token",
      },
      {
        status: 401,
        headers: {
          ...CORS_HEADERS,
          "WWW-Authenticate": 'Bearer error="invalid_token"',
        },
      },
    );
  }

  return Response.json(
    {
      sub: payload.sub,
      name: "Joker Notes User",
      preferred_username: payload.sub,
    },
    {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    },
  );
}
