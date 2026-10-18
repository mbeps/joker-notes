import crypto from "node:crypto";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Handles CORS preflight for dynamic client registration requests.
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * RFC 7591 Dynamic Client Registration endpoint.
 * Allows AI clients (e.g. Gemini Connected Apps, Claude, Cursor) to register client metadata.
 *
 * @param req - Inbound registration POST request.
 * @returns JSON response conforming to RFC 7591 with client_id.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as {
      client_name?: string;
      redirect_uris?: string[];
      grant_types?: string[];
      response_types?: string[];
      token_endpoint_auth_method?: string;
    };

    const clientId = `client_${crypto.randomBytes(12).toString("hex")}`;
    const clientName = body.client_name || "AI Assistant";
    const redirectUris = Array.isArray(body.redirect_uris)
      ? body.redirect_uris
      : [];

    const responsePayload = {
      client_id: clientId,
      client_name: clientName,
      redirect_uris: redirectUris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: body.token_endpoint_auth_method || "none",
    };

    return Response.json(responsePayload, {
      status: 201,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    });
  } catch {
    return Response.json(
      {
        error: "invalid_client_metadata",
        error_description: "Malformed or invalid JSON body",
      },
      {
        status: 400,
        headers: CORS_HEADERS,
      },
    );
  }
}
