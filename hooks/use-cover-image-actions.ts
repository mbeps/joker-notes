import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useEdgeStore } from "@/lib/edgestore";

/**
 * Custom React hook managing cover image operations combining EdgeStore asset
 * storage (upload, replacement, deletion) and Convex database persistence.
 *
 * @returns An object containing `uploadCover`, `removeCover`, and `isSubmitting` status.
 * @see https://docs.edgestore.dev
 * @see https://docs.convex.dev/database/writing-data
 */
export const useCoverImageActions = () => {
  const { edgestore } = useEdgeStore();
  const update = useMutation(api.documents.update);
  const removeCoverImage = useMutation(api.documents.removeCoverImage);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Uploads an image file to EdgeStore, optionally replacing an existing asset URL,
   * and updates the document record in Convex with the new cover URL.
   *
   * @param {Id<"documents">} documentId Identifier of the document whose cover is being updated.
   * @param {File} file File instance to upload.
   * @param {string} [replaceTargetUrl] Optional existing asset URL to replace in EdgeStore.
   * @returns {Promise<string>} Promise resolving to the uploaded image URL.
   */
  const uploadCover = useCallback(
    async (
      documentId: Id<"documents">,
      file: File,
      replaceTargetUrl?: string,
    ): Promise<string> => {
      setIsSubmitting(true);
      try {
        const res = await edgestore.publicFiles.upload({
          file,
          options: replaceTargetUrl ? { replaceTargetUrl } : undefined,
        });

        await update({
          id: documentId,
          coverImage: res.url,
        });

        return res.url;
      } finally {
        setIsSubmitting(false);
      }
    },
    [edgestore, update],
  );

  /**
   * Removes a document's cover image asset from EdgeStore (if present)
   * and clears the cover image attribute on the Convex document record.
   *
   * @param {Id<"documents">} documentId Identifier of the document whose cover is being cleared.
   * @param {string} [url] Optional EdgeStore URL of the asset to delete.
   * @returns {Promise<unknown>} Promise resolving when the asset is deleted and database record cleared.
   */
  const removeCover = useCallback(
    async (documentId: Id<"documents">, url?: string): Promise<unknown> => {
      if (url) {
        await edgestore.publicFiles.delete({
          url,
        });
      }

      return removeCoverImage({
        id: documentId,
      });
    },
    [edgestore, removeCoverImage],
  );

  return {
    uploadCover,
    removeCover,
    isSubmitting,
  };
};
