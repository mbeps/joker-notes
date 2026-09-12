import { useParams } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { SingleImageDropzone } from "@/components/image/single-image-dropzone";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import type { Id } from "@/convex/_generated/dataModel";
import { useCoverImage } from "@/hooks/use-cover-image";
import { useCoverImageActions } from "@/hooks/use-cover-image-actions";

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
  const coverImage = useCoverImage();
  const { uploadCover, isSubmitting } = useCoverImageActions();

  const [file, setFile] = useState<File>();

  /**
   * Closes the modal while clearing local upload state.
   */
  const onClose = () => {
    setFile(undefined);
    coverImage.onClose();
  };

  /**
   * Uploads the provided file to Edge Store and persists the resulting URL to Convex.
   * Reuses `replaceTargetUrl` so edits overwrite the existing asset.
   */
  const onChange = async (file?: File) => {
    if (file && params.documentId) {
      setFile(file);
      await uploadCover(
        params.documentId as Id<"documents">,
        file,
        coverImage.url,
      );
      onClose();
    }
  };

  return (
    <Dialog open={coverImage.isOpen} onOpenChange={coverImage.onClose}>
      <DialogContent>
        <DialogHeader>
          <h2 className="text-center font-semibold text-lg">Cover Image</h2>
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
