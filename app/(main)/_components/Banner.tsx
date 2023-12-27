"use client";

import ConfirmModal from "@/components/Modals/ConfirmModal";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

interface BannerProps {
  documentId: Id<"documents">;
}

const Banner: React.FC<BannerProps> = ({ documentId }) => {
  const router = useRouter();

  const remove = useMutation(api.documents.remove);
  const restore = useMutation(api.documents.restore);

  const onRemove = () => {
    const promise = remove({ id: documentId });

    toast.promise(promise, {
      loading: "Deleting note...",
      success: "Note deleted!",
      error: "Failed to delete note.",
    });

    router.push("/documents");
  };

  const onRestore = () => {
    const promise = restore({ id: documentId });

    toast.promise(promise, {
      loading: "Restoring note...",
      success: "Note restored!",
      error: "Failed to restore note.",
    });
  };

  return (
    <div
      className="
				w-full
				bg-red-500 dark:bg-red-800
				text-center text-sm p-2 text-white
				flex
				items-center justify-center
				gap-x-2
			"
    >
      <p>This page is in the Trash.</p>
      <Button
        size="sm"
        onClick={onRestore}
        variant="outline"
        className="
					border-white bg-transparent hover:bg-primary/5
					text-white hover:text-white
					p-1 px-2
					h-auto
					font-normal
					rounded-full
					"
      >
        Restore page
      </Button>
      <ConfirmModal onConfirm={onRemove}>
        <Button
          size="sm"
          variant="outline"
          className="
						border-white bg-transparent hover:bg-primary/5
						text-white hover:text-white
						p-1 px-2
						h-auto
						font-normal
						rounded-full
						"
        >
          Delete forever
        </Button>
      </ConfirmModal>
    </div>
  );
};
export default Banner;
