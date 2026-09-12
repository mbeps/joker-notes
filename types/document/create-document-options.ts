import type { Id } from "@/convex/_generated/dataModel";

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
