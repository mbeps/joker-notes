import type { McpServer } from "@modelcontextprotocol/server";
import type { ConvexHttpClient } from "convex/browser";
import { z } from "zod";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { createConvexClient, getMcpToken, getMcpUserId } from "@/lib/mcp/auth";

interface ToolResult {
  [x: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

const UNAUTHORIZED_RESPONSE: ToolResult = {
  isError: true,
  content: [
    {
      type: "text",
      text: "Unauthorized: Valid authentication token required.",
    },
  ],
};

function formatError(error: unknown): ToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return {
    isError: true,
    content: [{ type: "text", text: `Error: ${message}` }],
  };
}

/**
 * Higher-order handler enforcing authentication and uniform error serialization across MCP tools.
 */
function createAuthenticatedToolHandler<T>(
  action: (client: ConvexHttpClient, args: T) => Promise<unknown>,
) {
  return async (args: T, ctx: unknown): Promise<ToolResult> => {
    const userId = getMcpUserId(ctx);
    if (!userId) {
      return UNAUTHORIZED_RESPONSE;
    }

    const client = createConvexClient(getMcpToken(ctx));

    try {
      const res = await action(client, args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(res ?? { success: true }, null, 2),
          },
        ],
      };
    } catch (error) {
      return formatError(error);
    }
  };
}

/**
 * Registers domain-specific document management tools on the provided McpServer.
 *
 * @param server - McpServer instance to attach tools to.
 */
export function registerTools(server: McpServer): void {
  server.registerTool(
    "list_documents",
    {
      title: "List Documents",
      description:
        "List active documents/notes. Filter by parent folder or search query if provided.",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe("Search term to match against document titles"),
        parentDocument: z
          .string()
          .optional()
          .describe("Parent folder document ID to filter children"),
      },
    },
    createAuthenticatedToolHandler(
      async (client, args: { query?: string; parentDocument?: string }) => {
        if (args.query) {
          const allDocs = await client.query(api.documents.getSearch);
          const q = args.query.toLowerCase();
          return allDocs.filter((doc) => {
            const matchesQuery = doc.title.toLowerCase().includes(q);
            const matchesParent = args.parentDocument
              ? doc.parentDocument === args.parentDocument
              : true;
            return matchesQuery && matchesParent;
          });
        }

        return client.query(api.documents.getSidebar, {
          parentDocument: args.parentDocument
            ? (args.parentDocument as Id<"documents">)
            : undefined,
        });
      },
    ),
  );

  server.registerTool(
    "get_document",
    {
      title: "Get Document",
      description: "Retrieve a document note by its ID.",
      inputSchema: {
        documentId: z.string().describe("ID of the document to fetch"),
      },
    },
    createAuthenticatedToolHandler(
      async (client, args: { documentId: string }) => {
        return client.query(api.documents.getById, {
          documentId: args.documentId as Id<"documents">,
        });
      },
    ),
  );

  server.registerTool(
    "create_document",
    {
      title: "Create Document",
      description: "Create a new document note under an optional parent.",
      inputSchema: {
        title: z.string().describe("Title for the new note"),
        parentDocument: z
          .string()
          .optional()
          .describe("Optional parent document ID for nested notes"),
      },
    },
    createAuthenticatedToolHandler(
      async (client, args: { title: string; parentDocument?: string }) => {
        return client.mutation(api.documents.create, {
          title: args.title,
          parentDocument: args.parentDocument
            ? (args.parentDocument as Id<"documents">)
            : undefined,
        });
      },
    ),
  );

  server.registerTool(
    "update_document",
    {
      title: "Update Document",
      description:
        "Update a document note's title, content, icon, or publication status.",
      inputSchema: {
        id: z.string().describe("Document ID to update"),
        title: z.string().optional().describe("New title"),
        content: z.string().optional().describe("New JSON content string"),
        icon: z.string().optional().describe("Emoji icon string"),
        isPublished: z
          .boolean()
          .optional()
          .describe("Whether the note is publicly accessible"),
      },
    },
    createAuthenticatedToolHandler(
      async (
        client,
        args: {
          id: string;
          title?: string;
          content?: string;
          icon?: string;
          isPublished?: boolean;
        },
      ) => {
        return client.mutation(api.documents.update, {
          id: args.id as Id<"documents">,
          title: args.title,
          content: args.content,
          icon: args.icon,
          isPublished: args.isPublished,
        });
      },
    ),
  );

  server.registerTool(
    "archive_document",
    {
      title: "Archive Document",
      description: "Move a document and all its nested children to trash.",
      inputSchema: {
        id: z.string().describe("Document ID to archive"),
      },
    },
    createAuthenticatedToolHandler(async (client, args: { id: string }) => {
      return client.mutation(api.documents.archive, {
        id: args.id as Id<"documents">,
      });
    }),
  );

  server.registerTool(
    "restore_document",
    {
      title: "Restore Document",
      description:
        "Restore an archived document and its descendants from trash.",
      inputSchema: {
        id: z.string().describe("Document ID to restore"),
      },
    },
    createAuthenticatedToolHandler(async (client, args: { id: string }) => {
      return client.mutation(api.documents.restore, {
        id: args.id as Id<"documents">,
      });
    }),
  );

  server.registerTool(
    "delete_document",
    {
      title: "Delete Document",
      description: "Permanently delete a document note from the database.",
      inputSchema: {
        id: z.string().describe("Document ID to permanently delete"),
      },
    },
    createAuthenticatedToolHandler(async (client, args: { id: string }) => {
      return client.mutation(api.documents.remove, {
        id: args.id as Id<"documents">,
      });
    }),
  );

  server.registerTool(
    "list_trash",
    {
      title: "List Trash",
      description: "List all archived notes currently stored in trash.",
      inputSchema: {},
    },
    createAuthenticatedToolHandler(async (client) => {
      return client.query(api.documents.getTrash);
    }),
  );
}
