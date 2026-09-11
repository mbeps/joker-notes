"use client";

import type React from "react";
import ConfirmModal from "@/components/Modals/ConfirmModal";
import { Button } from "@/components/ui/button";
import type { Id } from "@/convex/_generated/dataModel";
import { useDocumentActions } from "@/hooks/useDocumentActions";

/**
 * Props supplied to the trash banner, carrying the Convex document id.
 */
interface BannerProps {
  documentId: Id<"documents">;
}

/**
 * Warning banner rendered for trashed documents offering restore or delete actions.
 * Utilizes Convex mutations for both operations while surfacing toast feedback.
 *
 * @param documentId Identifier of the trashed document.
 * @returns Banner UI with restore and delete affordances.
 * @see https://docs.convex.dev/database/writing-data
 */
const Banner: React.FC<BannerProps> = ({ documentId }) => {
  const { restoreDocument, deleteDocument } = useDocumentActions();

  /**
   * Permanently deletes the trashed document and navigates back to the list.
   */
  const onRemove = () => {
    deleteDocument(documentId, { shouldRedirect: true });
  };

  /**
   * Restores the trashed document to the active list.
   */
  const onRestore = () => {
    restoreDocument(documentId);
  };

  return (
    <div className="flex w-full items-center justify-center gap-x-2 bg-red-500 p-2 text-center text-sm text-white dark:bg-red-800">
      <p>This page is in the Trash.</p>
      <Button
        size="sm"
        onClick={onRestore}
        variant="outline"
        className="h-auto rounded-full border-white bg-transparent p-1 px-2 font-normal text-white hover:bg-primary/5 hover:text-white"
      >
        Restore page
      </Button>
      <ConfirmModal onConfirm={onRemove}>
        <Button
          size="sm"
          variant="outline"
          className="h-auto rounded-full border-white bg-transparent p-1 px-2 font-normal text-white hover:bg-primary/5 hover:text-white"
        >
          Delete forever
        </Button>
      </ConfirmModal>
    </div>
  );
};
export default Banner;
