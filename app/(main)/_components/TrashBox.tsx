"use client";

import ConfirmModal from "@/components/Modals/ConfirmModal";
import { Spinner } from "@/components/Spinner/Spinner";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Search, Trash, Undo } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

const TrashBox: React.FC = () => {
  /**
   * Allows redirecting to another page.
   */
  const router = useRouter();
  /**
   * Allows extracting the document ID from the URL.
   */
  const params = useParams();
  /**
   * Fetches archived (in trash) documents from the database.
   */
  const documents = useQuery(api.documents.getTrash);
  /**
   * Allows restoring a document from archive (in trash).
   * Uses the `restore` mutation from the `documents` API from Convex.
   */
  const restore = useMutation(api.documents.restore);
  /**
   * Allows removing a document from the database permanently.
   * Uses the `remove` mutation from the `documents` API from Convex.
   */
  const remove = useMutation(api.documents.remove);

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
   * @param documentId (string) The ID of the document.
   */
  const onClick = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  /**
   * Restores a document from the archive (in trash).
   * Marks the document as not archived (not in trash).
   * @param event (React.MouseEvent<HTMLDivElement, MouseEvent>) The click event.
   * @param documentId (string) The ID of the document.
   */
  const onRestore = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    documentId: Id<"documents">,
  ) => {
    event.stopPropagation(); // prevents the event from bubbling up to the parent element
    const promise = restore({ id: documentId }); // restores the document from the archive (in trash)

    toast.promise(promise, {
      loading: "Restoring note...",
      success: "Note restored!",
      error: " Failed to restore note.",
    });
  };

  /**
   * Permanently deletes a document from the database.
   * Once the document is deleted, it cannot be restored.
   * Redirects to the documents page if the document being deleted is currently open.
   */
  const onRemove = (documentId: Id<"documents">) => {
    const promise = remove({ id: documentId }); // permanently deletes the document from the database

    toast.promise(promise, {
      loading: "Deleting note...",
      success: "Note deleted!",
      error: " Failed to delete note.",
    });

    if (params.documentId === documentId) {
      // redirects to the documents page if the document being deleted is currently open
      router.push("/documents");
    }
  };

  // shows a loading spinner if the documents are still being fetched
  if (documents === undefined) {
    return (
      <div className="h-full flex items-center justify-center p-4">
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
          className="h-7 px-2 focus-visible:ring-transparent bg-secondary"
          placeholder="Filter by page title..."
        />
      </div>
      <div className="mt-2 px-1 pb-1">
        <p className="hidden last:block text-xs text-center text-muted-foreground pb-2">
          No documents found.
        </p>
        {filteredDocuments?.map((document) => (
          <div
            key={document._id}
            role="button"
            onClick={() => onClick(document._id)}
            className="text-sm rounded-sm w-full hover:bg-primary/5 flex items-center text-primary justify-between"
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
