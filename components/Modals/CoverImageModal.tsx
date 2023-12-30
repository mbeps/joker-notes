import { useCoverImage } from "@/hooks/useCoverImage";
import { useMutation } from "convex/react";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SingleImageDropzone } from "../Images/SingleImageDropzone";
import { useEdgeStore } from "@/lib/edgestore";

const CoverImageModal: React.FC = () => {
  /**
   * Gets the URL parameters.
   * This can be used to get the document ID from the URL.
   */
  const params = useParams();
  /**
   * Mutation hook to update the document.
   * This calls the `update` API method from `convex/documents.ts`.
   */
  const update = useMutation(api.documents.update);
  /**
   * Hook to get the cover image state.
   * This opens a modal to select a cover image.
   */
  const coverImage = useCoverImage();
  const { edgestore } = useEdgeStore();

  /**
   * State to store the selected image to be uploaded.
   */
  const [file, setFile] = useState<File>();
  /**
   * State to store if the form is submitting.
   */
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle close button click.
   * This clears the selected file, clears the submitting state, and closes the modal.
   */
  const onClose = () => {
    setFile(undefined);
    setIsSubmitting(false);
    coverImage.onClose();
  };

  /**
   * Updates or creates a cover image for the document.
   * @param file (File): image to upload
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
          className="w-full outline-none"
          disabled={isSubmitting}
          value={file}
          onChange={onChange}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CoverImageModal;
