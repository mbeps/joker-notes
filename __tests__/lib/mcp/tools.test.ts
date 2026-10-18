import type { McpServer } from "@modelcontextprotocol/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { registerTools } from "@/lib/mcp/tools";

const mockQuery = vi.fn();
const mockMutation = vi.fn();
const mockSetAuth = vi.fn();

vi.mock("@/lib/mcp/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/mcp/auth")>();
  return {
    ...actual,
    createConvexClient: vi.fn().mockImplementation(() => ({
      query: mockQuery,
      mutation: mockMutation,
      setAuth: mockSetAuth,
    })),
  };
});

describe("lib/mcp/tools", () => {
  const registeredTools: Record<
    string,
    {
      config: Record<string, unknown>;
      handler: (args: any, ctx: any) => Promise<any>;
    }
  > = {};

  const mockServer = {
    registerTool: vi.fn().mockImplementation(
      (name: string, config: any, handler: any) => {
        registeredTools[name] = { config, handler };
      },
    ),
  } as unknown as McpServer;

  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(registeredTools)) {
      delete registeredTools[key];
    }
    registerTools(mockServer);
  });

  it("registers all 8 required document management tools", () => {
    expect(mockServer.registerTool).toHaveBeenCalledTimes(8);
    expect(Object.keys(registeredTools)).toEqual([
      "list_documents",
      "get_document",
      "create_document",
      "update_document",
      "archive_document",
      "restore_document",
      "delete_document",
      "list_trash",
    ]);
  });

  const authCtx = {
    http: {
      authInfo: {
        token: "mock-token",
        extra: { userId: "user-123" },
      },
    },
  };

  const unauthCtx = {
    http: {
      authInfo: undefined,
    },
  };

  describe("authentication guard", () => {
    it("returns error response when user is unauthenticated", async () => {
      const result = await registeredTools.list_trash.handler({}, unauthCtx);
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unauthorized");
    });
  });

  describe("list_documents", () => {
    it("lists documents by sidebar without query", async () => {
      const mockDocs = [{ _id: "doc1", title: "Note 1" }];
      mockQuery.mockResolvedValueOnce(mockDocs);

      const result = await registeredTools.list_documents.handler(
        { parentDocument: "parent-1" },
        authCtx,
      );

      expect(mockQuery).toHaveBeenCalledWith(api.documents.getSidebar, {
        parentDocument: "parent-1" as Id<"documents">,
      });
      expect(result.isError).toBeUndefined();
      expect(JSON.parse(result.content[0].text)).toEqual(mockDocs);
    });

    it("searches documents and filters by query and parentDocument", async () => {
      const searchResults = [
        { _id: "doc1", title: "Meeting Notes", parentDocument: "parent-1" },
        { _id: "doc2", title: "Meeting Recap", parentDocument: "parent-2" },
        { _id: "doc3", title: "Grocery List", parentDocument: "parent-1" },
      ];
      mockQuery.mockResolvedValueOnce(searchResults);

      const result = await registeredTools.list_documents.handler(
        { query: "meeting", parentDocument: "parent-1" },
        authCtx,
      );

      expect(mockQuery).toHaveBeenCalledWith(api.documents.getSearch);
      expect(JSON.parse(result.content[0].text)).toEqual([
        { _id: "doc1", title: "Meeting Notes", parentDocument: "parent-1" },
      ]);
    });

    it("searches documents and filters by query without parentDocument", async () => {
      const searchResults = [
        { _id: "doc1", title: "Meeting Notes", parentDocument: "parent-1" },
        { _id: "doc2", title: "Shopping List", parentDocument: "parent-2" },
      ];
      mockQuery.mockResolvedValueOnce(searchResults);

      const result = await registeredTools.list_documents.handler(
        { query: "notes" },
        authCtx,
      );

      expect(mockQuery).toHaveBeenCalledWith(api.documents.getSearch);
      expect(JSON.parse(result.content[0].text)).toEqual([
        { _id: "doc1", title: "Meeting Notes", parentDocument: "parent-1" },
      ]);
    });

    it("lists documents by sidebar without parentDocument", async () => {
      const mockDocs = [{ _id: "doc1", title: "Root Note" }];
      mockQuery.mockResolvedValueOnce(mockDocs);

      const result = await registeredTools.list_documents.handler({}, authCtx);

      expect(mockQuery).toHaveBeenCalledWith(api.documents.getSidebar, {
        parentDocument: undefined,
      });
      expect(JSON.parse(result.content[0].text)).toEqual(mockDocs);
    });

    it("handles error during search", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Convex connection failed"));

      const result = await registeredTools.list_documents.handler({}, authCtx);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe("Error: Convex connection failed");
    });
  });

  describe("get_document", () => {
    it("retrieves a document by ID", async () => {
      const doc = { _id: "doc-1", title: "Single Doc" };
      mockQuery.mockResolvedValueOnce(doc);

      const result = await registeredTools.get_document.handler(
        { documentId: "doc-1" },
        authCtx,
      );

      expect(mockQuery).toHaveBeenCalledWith(api.documents.getById, {
        documentId: "doc-1" as Id<"documents">,
      });
      expect(JSON.parse(result.content[0].text)).toEqual(doc);
    });

    it("handles not found or unauthorized error", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Not found"));

      const result = await registeredTools.get_document.handler(
        { documentId: "doc-missing" },
        authCtx,
      );

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe("Error: Not found");
    });
  });

  describe("create_document", () => {
    it("creates a document with title and parent", async () => {
      mockMutation.mockResolvedValueOnce("doc-new-id");

      const result = await registeredTools.create_document.handler(
        { title: "New Note", parentDocument: "folder-1" },
        authCtx,
      );

      expect(mockMutation).toHaveBeenCalledWith(api.documents.create, {
        title: "New Note",
        parentDocument: "folder-1" as Id<"documents">,
      });
      expect(JSON.parse(result.content[0].text)).toBe("doc-new-id");
    });

    it("creates a document without parentDocument", async () => {
      mockMutation.mockResolvedValueOnce("doc-root-id");

      const result = await registeredTools.create_document.handler(
        { title: "Root Note" },
        authCtx,
      );

      expect(mockMutation).toHaveBeenCalledWith(api.documents.create, {
        title: "Root Note",
        parentDocument: undefined,
      });
      expect(JSON.parse(result.content[0].text)).toBe("doc-root-id");
    });
  });

  describe("update_document", () => {
    it("updates a document with given fields", async () => {
      const updated = { _id: "doc-1", title: "Updated Title" };
      mockMutation.mockResolvedValueOnce(updated);

      const result = await registeredTools.update_document.handler(
        {
          id: "doc-1",
          title: "Updated Title",
          content: "new content",
          icon: "🚀",
          isPublished: true,
        },
        authCtx,
      );

      expect(mockMutation).toHaveBeenCalledWith(api.documents.update, {
        id: "doc-1" as Id<"documents">,
        title: "Updated Title",
        content: "new content",
        icon: "🚀",
        isPublished: true,
      });
      expect(JSON.parse(result.content[0].text)).toEqual(updated);
    });
  });

  describe("archive_document", () => {
    it("archives document and descendants", async () => {
      mockMutation.mockResolvedValueOnce({ _id: "doc-1", isArchived: true });

      const result = await registeredTools.archive_document.handler(
        { id: "doc-1" },
        authCtx,
      );

      expect(mockMutation).toHaveBeenCalledWith(api.documents.archive, {
        id: "doc-1" as Id<"documents">,
      });
      expect(result.isError).toBeUndefined();
    });
  });

  describe("restore_document", () => {
    it("restores document from trash", async () => {
      mockMutation.mockResolvedValueOnce({ _id: "doc-1", isArchived: false });

      const result = await registeredTools.restore_document.handler(
        { id: "doc-1" },
        authCtx,
      );

      expect(mockMutation).toHaveBeenCalledWith(api.documents.restore, {
        id: "doc-1" as Id<"documents">,
      });
      expect(result.isError).toBeUndefined();
    });
  });

  describe("delete_document", () => {
    it("permanently removes document", async () => {
      mockMutation.mockResolvedValueOnce(undefined);

      const result = await registeredTools.delete_document.handler(
        { id: "doc-1" },
        authCtx,
      );

      expect(mockMutation).toHaveBeenCalledWith(api.documents.remove, {
        id: "doc-1" as Id<"documents">,
      });
      expect(JSON.parse(result.content[0].text)).toEqual({ success: true });
    });

    it("returns mutation result if non-null", async () => {
      mockMutation.mockResolvedValueOnce({ deleted: "doc-1" });

      const result = await registeredTools.delete_document.handler(
        { id: "doc-1" },
        authCtx,
      );

      expect(JSON.parse(result.content[0].text)).toEqual({ deleted: "doc-1" });
    });
  });

  describe("list_trash", () => {
    it("lists all trash documents", async () => {
      const trash = [{ _id: "doc-trashed", title: "Old Note" }];
      mockQuery.mockResolvedValueOnce(trash);

      const result = await registeredTools.list_trash.handler({}, authCtx);

      expect(mockQuery).toHaveBeenCalledWith(api.documents.getTrash);
      expect(JSON.parse(result.content[0].text)).toEqual(trash);
    });

    it("handles non-Error rejection", async () => {
      mockQuery.mockRejectedValueOnce("Plain string error");

      const result = await registeredTools.list_trash.handler({}, authCtx);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe("Error: Plain string error");
    });
  });
});
