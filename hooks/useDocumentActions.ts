import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { ROUTES } from "@/constants/routes";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";

/**
 * Configuration options for document creation.
 */
export interface CreateDocumentOptions {
  /**
   * Title for the new document. Defaults to "Untitled".
   */
  title?: string;
  /**
   * Optional parent document identifier for nested document hierarchies.
   */
  parentDocument?: Id<"documents">;
  /**
   * Callback invoked immediately after successful document creation with the new ID.
   */
  onSuccess?: (documentId: Id<"documents">) => void;
}

/**
 * Configuration options for permanent document deletion.
 */
export interface DeleteDocumentOptions {
  /**
   * Whether to redirect to the documents overview page upon deletion.
   */
  shouldRedirect?: boolean;
}

/**
 * Custom React hook encapsulating document lifecycle operations, Convex mutations,
 * Sonner toast notifications, and Next.js route navigation.
 *
 * @returns An object containing `createDocument`, `archiveDocument`, `restoreDocument`, and `deleteDocument` action handlers.
 * @see https://docs.convex.dev/database/writing-data
 */
export const useDocumentActions = () => {
  const router = useRouter();
  const create = useMutation(api.documents.create);
  const archive = useMutation(api.documents.archive);
  const restore = useMutation(api.documents.restore);
  const remove = useMutation(api.documents.remove);

  /**
   * Creates a new document with an optional parent document, displays toast feedback,
   * invokes an optional success callback, and navigates to the document detail page.
   *
   * @param {CreateDocumentOptions} [options={}] Configuration options for document creation.
   * @returns {Promise<Id<"documents">>} Promise resolving to the newly created document identifier.
   */
  const createDocument = useCallback(
    async (options: CreateDocumentOptions = {}): Promise<Id<"documents">> => {
      const { title = "Untitled", parentDocument, onSuccess } = options;

      const promise = create({ title, parentDocument }).then((documentId) => {
        onSuccess?.(documentId);
        router.push(ROUTES.DOCUMENTS.detail(documentId));
        return documentId;
      });

      toast.promise(promise, {
        loading: "Creating a new note...",
        success: "New note created!",
        error: "Failed to create a new note.",
      });

      return promise;
    },
    [create, router],
  );

  /**
   * Moves an active document to the trash archive, displays toast feedback,
   * and navigates to the primary documents root.
   *
   * @param {Id<"documents">} id Identifier of the document to archive.
   * @returns {Promise<Doc<"documents"> | null>} Promise resolving to the archived document.
   */
  const archiveDocument = useCallback(
    async (id: Id<"documents">): Promise<Doc<"documents"> | null> => {
      const promise = archive({ id }).then((res) => {
        router.push(ROUTES.DOCUMENTS.path);
        return res;
      });

      toast.promise(promise, {
        loading: "Moving to trash...",
        success: "Note moved to trash!",
        error: "Failed to archive note.",
      });

      return promise;
    },
    [archive, router],
  );

  /**
   * Restores a trashed document back to the active document list with toast feedback.
   *
   * @param {Id<"documents">} id Identifier of the document to restore.
   * @returns {Promise<Doc<"documents"> | null>} Promise resolving to the restored document.
   */
  const restoreDocument = useCallback(
    async (id: Id<"documents">): Promise<Doc<"documents"> | null> => {
      const promise = restore({ id });

      toast.promise(promise, {
        loading: "Restoring note...",
        success: "Note restored!",
        error: "Failed to restore note.",
      });

      return promise;
    },
    [restore],
  );

  /**
   * Permanently deletes a document from Convex with toast feedback and optional route redirect.
   *
   * @param {Id<"documents">} id Identifier of the document to permanently remove.
   * @param {DeleteDocumentOptions} [options={}] Deletion options controlling navigation behavior.
   * @returns {Promise<Doc<"documents"> | null>} Promise resolving to the removed document.
   */
  const deleteDocument = useCallback(
    async (
      id: Id<"documents">,
      options: DeleteDocumentOptions = {},
    ): Promise<Doc<"documents"> | null> => {
      const { shouldRedirect = false } = options;

      const promise = remove({ id }).then((res) => {
        if (shouldRedirect) {
          router.push(ROUTES.DOCUMENTS.path);
        }
        return res;
      });

      toast.promise(promise, {
        loading: "Deleting note...",
        success: "Note deleted!",
        error: "Failed to delete note.",
      });

      return promise;
    },
    [remove, router],
  );

  return {
    createDocument,
    archiveDocument,
    restoreDocument,
    deleteDocument,
  };
};
