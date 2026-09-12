"use client";

import { useQuery } from "convex/react";
import { Search, Trash, Undo } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import ConfirmModal from "@/components/modal/confirm-modal";
import { Spinner } from "@/components/spinner/spinner";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/config/routes";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useDocumentActions } from "@/hooks/use-document-actions";

/**
 * Popover content that lists trashed documents with options to restore or permanently delete.
 * Uses Convex queries and mutations to reflect trash state in real time.
 *
 * @returns Trash management interface containing filter input and action buttons.
 * @see https://docs.convex.dev/database/queries
 * @see https://docs.convex.dev/database/writing-data
 */
const TrashBox: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const documents = useQuery(api.documents.getTrash);
  const { restoreDocument, deleteDocument } = useDocumentActions();

  // keeps track of the search query
  const [search, setSearch] = useState("");

  /**
   * Filters the documents based on the search query.
   */
  const filteredDocuments = documents?.filter((document) => {
    return document.title.toLowerCase().includes(search.toLowerCase());
  });

  /**
   * Redirects the user to a specific document page.
   *
   * @param documentId Identifier of the document to open.
   */
  const onClick = (documentId: string) => {
    router.push(ROUTES.DOCUMENTS.detail(documentId));
  };

  /**
   * Restores a trashed document and surfaces toast feedback.
   *
   * @param event Click event coming from the restore icon.
   * @param documentId Identifier of the document to restore.
   */
  const onRestore = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    documentId: Id<"documents">,
  ) => {
    event.stopPropagation(); // prevents the event from bubbling up to the parent element
    restoreDocument(documentId);
  };

  /**
   * Permanently removes a document and redirects if the active page is deleted.
   *
   * @param documentId Identifier of the document to remove.
   */
  const onRemove = (documentId: Id<"documents">) => {
    deleteDocument(documentId, {
      shouldRedirect: params.documentId === documentId,
    });
  };

  // shows a loading spinner if the documents are still being fetched
  if (documents === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="flex items-center gap-x-1 p-2">
        <Search className="h-4 w-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 bg-secondary px-2 focus-visible:ring-transparent"
          placeholder="Filter by page title..."
        />
      </div>
      <div className="mt-2 px-1 pb-1">
        <p className="hidden pb-2 text-center text-muted-foreground text-xs last:block">
          No documents found.
        </p>
        {filteredDocuments?.map((document) => (
          <div
            key={document._id}
            role="button"
            onClick={() => onClick(document._id)}
            className="flex w-full items-center justify-between rounded-md text-primary text-sm hover:bg-primary/5"
          >
            <span className="truncate pl-2">{document.title}</span>
            <div className="flex items-center">
              <div
                onClick={(e) => onRestore(e, document._id)}
                role="button"
                className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
              >
                <Undo className="h-4 w-4 text-muted-foreground" />
              </div>
              <ConfirmModal onConfirm={() => onRemove(document._id)}>
                <div
                  role="button"
                  className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                >
                  <Trash className="h-4 w-4 text-muted-foreground" />
                </div>
              </ConfirmModal>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrashBox;
