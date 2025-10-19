import { useCoverImage } from "@/hooks/useCoverImage";
import { useMutation } from "convex/react";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SingleImageDropzone } from "../Images/SingleImageDropzone";
import { useEdgeStore } from "@/lib/edgestore";

/**
 * Modal that surfaces a single-image dropzone for uploading or replacing document cover art.
 * Coordinates Edge Store uploads with Convex mutations tied to the active document.
 *
 * @returns Dialog that lets the user manage the current document cover image.
 * @see https://docs.edgestore.dev
 * @see https://docs.convex.dev/database/writing-data
 */
const CoverImageModal: React.FC = () => {
  const params = useParams();
  const update = useMutation(api.documents.update);
  const coverImage = useCoverImage();
  const { edgestore } = useEdgeStore();

  const [file, setFile] = useState<File>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Closes the modal while clearing local upload state.
   */
  const onClose = () => {
    setFile(undefined);
    setIsSubmitting(false);
    coverImage.onClose();
  };

  /**
   * Uploads the provided file to Edge Store and persists the resulting URL to Convex.
   * Reuses `replaceTargetUrl` so edits overwrite the existing asset.
   */
  const onChange = async (file?: File) => {
    if (file) {
      setIsSubmitting(true);
      setFile(file);

      /**
       * If the document already has a cover image, replace the existing image.
       * This image is updated within EdgeStore which stores the images for this projects.
       */
      const res = await edgestore.publicFiles.upload({
        file,
        options: {
          replaceTargetUrl: coverImage.url,
        },
      });

      /**
       * Update the document with the new cover image.
       * Uses the URL from EdgeStore and updates the document with the new cover image.
       */
      await update({
        id: params.documentId as Id<"documents">,
        coverImage: res.url,
      });

      // Clear the selected file, submitting state and close the modal.
      onClose();
    }
  };

  return (
    <Dialog open={coverImage.isOpen} onOpenChange={coverImage.onClose}>
      <DialogContent>
        <DialogHeader>
          <h2 className="text-center text-lg font-semibold">Cover Image</h2>
        </DialogHeader>
        {/* Dropzone where the file is selected and then displayed (when there is image) */}
        <SingleImageDropzone
          className="w-full outline-hidden"
          disabled={isSubmitting}
          value={file}
          onChange={onChange}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CoverImageModal;
