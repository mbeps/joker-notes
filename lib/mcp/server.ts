import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";

import { registerTools } from "@/lib/mcp/tools";

/**
 * Creates a stateless MCP v2 Streamable HTTP server handler.
 * Strictly enforces MCP v2 (2026-07-28) specification with legacy: "reject".
 *
 * @returns Configured MCP server handler instance.
 */
export function createNotesMcpHandler() {
  return createMcpHandler(
    async () => {
      const server = new McpServer({
        name: "joker-notes-mcp",
        version: "2.0.0",
      });
      registerTools(server);
      return server;
    },
    {
      legacy: "reject",
    },
  );
}

/**
 * Shared singleton MCP server handler instance for Next.js route handlers.
 */
export const mcpServerHandler = createNotesMcpHandler();
