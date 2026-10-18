import { describe, expect, it } from "vitest";

import { createNotesMcpHandler, mcpServerHandler } from "@/lib/mcp/server";

describe("lib/mcp/server", () => {
  it("exports mcpServerHandler and createNotesMcpHandler with fetch and close", () => {
    expect(mcpServerHandler).toBeDefined();
    expect(typeof mcpServerHandler.fetch).toBe("function");
    expect(typeof mcpServerHandler.close).toBe("function");

    const instance = createNotesMcpHandler();
    expect(instance).toBeDefined();
    expect(typeof instance.fetch).toBe("function");
    expect(typeof instance.close).toBe("function");
  });

  it("processes legacy 2024-11-05 protocol requests successfully with HTTP 200", async () => {
    const handler = createNotesMcpHandler();

    const req = new Request("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": "2024-11-05",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      }),
    });

    const response = await handler.fetch(req);
    expect(response.status).toBe(200);

    const contentType = response.headers.get("content-type");
    const text = await response.text();
    expect(text).toContain('"tools"');
    if (contentType?.includes("text/event-stream")) {
      expect(text).toContain("event: message");
    } else {
      const data = JSON.parse(text);
      expect(data.result.tools).toBeDefined();
    }

    await handler.close();
  });

  it("processes modern 2026-07-28 MCP v2 requests successfully", async () => {
    const handler = createNotesMcpHandler();

    const req = new Request("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": "2026-07-28",
        "mcp-method": "tools/call",
        "mcp-name": "list_trash",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "list_trash",
          arguments: {},
          _meta: {
            "io.modelcontextprotocol/protocolVersion": "2026-07-28",
            "io.modelcontextprotocol/clientCapabilities": {},
          },
        },
      }),
    });

    const response = await handler.fetch(req, {
      authInfo: {
        token: "tok",
        extra: { userId: "user-123" },
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.result).toBeDefined();
    expect(data.result.content).toBeDefined();

    await handler.close();
  });
});

