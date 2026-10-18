import { withMcpAuth } from "mcp-handler";

import { verifyMcpToken } from "@/lib/mcp/auth";
import { mcpServerHandler } from "@/lib/mcp/server";

export const dynamic = "force-dynamic";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Accept, Mcp-Protocol-Version, Mcp-Method, Mcp-Name, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

/**
 * Attaches standard CORS headers to outgoing MCP responses.
 *
 * @param res - Original HTTP response.
 * @returns Augmented response with CORS headers.
 */
function addCorsHeaders(res: Response): Response {
  const newHeaders = new Headers(res.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    newHeaders.set(key, value);
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders,
  });
}

/**
 * Normalizes request headers to avoid 415 Unsupported Media Type or 406 Not Acceptable rejections.
 *
 * @param req - Inbound request from AI client.
 * @returns Sanitized and normalized Request.
 */
function normalizeRequest(req: Request): Request {
  const headers = new Headers(req.headers);

  const contentType = headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    headers.set("content-type", "application/json");
  }

  const accept = headers.get("accept");
  if (!accept || accept === "*/*") {
    headers.set("accept", "application/json, text/event-stream");
  }

  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers,
    signal: req.signal,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
    init.duplex = "half";
  }

  return new Request(req.url, init);
}

const authHandler = withMcpAuth(
  async (req: Request) => {
    const authInfo = (req as Request & { auth?: unknown }).auth;
    return mcpServerHandler.fetch(req, { authInfo });
  },
  verifyMcpToken,
  {
    required: false,
    resourceMetadataPath: "/.well-known/oauth-protected-resource/api/mcp",
  },
);

async function handleRequest(req: Request): Promise<Response> {
  const accept = req.headers.get("accept");
  if (req.method === "GET" && accept?.includes("text/html")) {
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Joker Notes MCP Server</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafafa; color: #171717; }
    .card { max-width: 480px; padding: 2rem; background: #fff; border-radius: 1rem; border: 1px solid #e5e5e5; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #737373; font-size: 0.875rem; line-height: 1.5; }
    code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.8125rem; word-break: break-all; }
    .btn { display: inline-block; margin-top: 1.25rem; padding: 0.5rem 1rem; background: #171717; color: #fff; text-decoration: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 500; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Joker Notes MCP Server</h1>
    <p>This endpoint serves Model Context Protocol (MCP) Streamable HTTP requests for AI assistants including Google Gemini, Claude, and ChatGPT.</p>
    <p>Endpoint URL: <code>${req.url}</code></p>
    <a href="/" class="btn">Go to Joker Notes</a>
  </div>
</body>
</html>`,
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "content-type": "text/html; charset=utf-8",
        },
      },
    );
  }

  const normalized = normalizeRequest(req);
  const response = await authHandler(normalized);
  return addCorsHeaders(response);
}

/**
 * Handles CORS preflight requests for modern Web-based MCP clients.
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Health check / probe endpoint returning 200 OK with JSON content type.
 */
export async function HEAD(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

export { handleRequest as GET, handleRequest as POST };
