import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/routes";
import type { Id } from "@/convex/_generated/dataModel";
import { useDocumentActions } from "@/hooks/use-document-actions";

const push = vi.fn();
const mockCreate = vi.fn();
const mockArchive = vi.fn();
const mockRestore = vi.fn();
const mockRemove = vi.fn();
const mockToastPromise = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("convex/react", () => ({
  useMutation: (mutationRef: unknown) => {
    if (mutationRef === "create") return mockCreate;
    if (mutationRef === "archive") return mockArchive;
    if (mutationRef === "restore") return mockRestore;
    if (mutationRef === "remove") return mockRemove;
    return vi.fn();
  },
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    documents: {
      create: "create",
      archive: "archive",
      restore: "restore",
      remove: "remove",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    promise: (...args: unknown[]) => mockToastPromise(...args),
  },
}));

describe("useDocumentActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDocument", () => {
    it("creates a document with default title and navigates to detail route", async () => {
      const docId = "doc-123" as Id<"documents">;
      mockCreate.mockResolvedValueOnce(docId);

      const { result } = renderHook(() => useDocumentActions());
      const promise = result.current.createDocument();

      expect(mockCreate).toHaveBeenCalledWith({
        title: "Untitled",
        parentDocument: undefined,
      });
      expect(mockToastPromise).toHaveBeenCalledWith(
        expect.any(Promise),
        expect.objectContaining({
          loading: "Creating a new note...",
          success: "New note created!",
          error: "Failed to create a new note.",
        }),
      );

      const resolvedId = await promise;
      expect(resolvedId).toBe(docId);
      expect(push).toHaveBeenCalledWith(ROUTES.DOCUMENTS.detail(docId));
    });

    it("creates a document with custom title, parentDocument, and triggers onSuccess", async () => {
      const docId = "doc-456" as Id<"documents">;
      const parentId = "parent-1" as Id<"documents">;
      const onSuccess = vi.fn();
      mockCreate.mockResolvedValueOnce(docId);

      const { result } = renderHook(() => useDocumentActions());
      const promise = result.current.createDocument({
        title: "My Note",
        parentDocument: parentId,
        onSuccess,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        title: "My Note",
        parentDocument: parentId,
      });

      const resolvedId = await promise;
      expect(resolvedId).toBe(docId);
      expect(onSuccess).toHaveBeenCalledWith(docId);
      expect(push).toHaveBeenCalledWith(ROUTES.DOCUMENTS.detail(docId));
    });
  });

  describe("archiveDocument", () => {
    it("archives document, shows toast, and navigates to documents path", async () => {
      const docId = "doc-archive" as Id<"documents">;
      const archiveResult = { _id: docId, isArchived: true };
      mockArchive.mockResolvedValueOnce(archiveResult);

      const { result } = renderHook(() => useDocumentActions());
      const promise = result.current.archiveDocument(docId);

      expect(mockArchive).toHaveBeenCalledWith({ id: docId });
      expect(mockToastPromise).toHaveBeenCalledWith(
        expect.any(Promise),
        expect.objectContaining({
          loading: "Moving to trash...",
          success: "Note moved to trash!",
          error: "Failed to archive note.",
        }),
      );

      const resolved = await promise;
      expect(resolved).toEqual(archiveResult);
      expect(push).toHaveBeenCalledWith(ROUTES.DOCUMENTS.path);
    });
  });

  describe("restoreDocument", () => {
    it("restores document and surfaces toast notification", async () => {
      const docId = "doc-restore" as Id<"documents">;
      const restoreResult = { _id: docId, isArchived: false };
      mockRestore.mockResolvedValueOnce(restoreResult);

      const { result } = renderHook(() => useDocumentActions());
      const promise = result.current.restoreDocument(docId);

      expect(mockRestore).toHaveBeenCalledWith({ id: docId });
      expect(mockToastPromise).toHaveBeenCalledWith(
        expect.any(Promise),
        expect.objectContaining({
          loading: "Restoring note...",
          success: "Note restored!",
          error: "Failed to restore note.",
        }),
      );

      const resolved = await promise;
      expect(resolved).toEqual(restoreResult);
    });
  });

  describe("deleteDocument", () => {
    it("deletes document without redirect by default", async () => {
      const docId = "doc-delete" as Id<"documents">;
      mockRemove.mockResolvedValueOnce({ _id: docId });

      const { result } = renderHook(() => useDocumentActions());
      const promise = result.current.deleteDocument(docId);

      expect(mockRemove).toHaveBeenCalledWith({ id: docId });
      expect(mockToastPromise).toHaveBeenCalledWith(
        expect.any(Promise),
        expect.objectContaining({
          loading: "Deleting note...",
          success: "Note deleted!",
          error: "Failed to delete note.",
        }),
      );

      await promise;
      expect(push).not.toHaveBeenCalled();
    });

    it("deletes document and redirects when shouldRedirect is true", async () => {
      const docId = "doc-delete-redirect" as Id<"documents">;
      mockRemove.mockResolvedValueOnce({ _id: docId });

      const { result } = renderHook(() => useDocumentActions());
      const promise = result.current.deleteDocument(docId, {
        shouldRedirect: true,
      });

      expect(mockRemove).toHaveBeenCalledWith({ id: docId });
      await promise;
      expect(push).toHaveBeenCalledWith(ROUTES.DOCUMENTS.path);
    });
  });
});

