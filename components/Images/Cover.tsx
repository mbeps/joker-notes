"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCoverImage } from "@/hooks/useCoverImage";
import { useEdgeStore } from "@/lib/edgestore";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { ImageIcon, X } from "lucide-react";
import { useParams } from "next/navigation";
import React from "react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import Image from "next/image";

interface CoverImageProps {
  url?: string;
  preview?: boolean;
}

export const Cover = ({ url, preview }: CoverImageProps) => {
  /**
   * Hooks allowing to update stored data within EdgeStore.
   * EdgeStore is the project's file storage.
   */
  const { edgestore } = useEdgeStore();
  /**
   * Gets the URL parameters.
   * This can be used to get the document ID from the URL.
   */
  const params = useParams();
  /**
   * Mutation hook to update the document.
   */
  const coverImage = useCoverImage();
  /**
   * Mutation hook to remove the cover image.
   * Calls the `removeCoverImage` API method from `convex/documents.ts`.
   */
  const removeCoverImage = useMutation(api.documents.removeCoverImage);

  /**
   * Handle remove button click.
   * This removes the cover image from the document.
   */
  const onRemove = async () => {
    if (url) {
      // removes the image from EdgeStore
      await edgestore.publicFiles.delete({
        url: url,
      });
    }
    // calls the `removeCoverImage` API method to remove the image from the Convex database
    removeCoverImage({
      id: params.documentId as Id<"documents">,
    });
  };

  return (
    <div
      className={cn(
        "relative w-full h-[35vh] group",
        !url && "h-[12vh]",
        url && "bg-muted",
      )}
    >
      {/* if there is cover image, display it */}
      {!!url && <Image src={url} fill alt="Cover" className="object-cover" />}

      {/* if there is cover image and document is editable */}
      {url && !preview && (
        <div className="opacity-0 group-hover:opacity-100 absolute bottom-5 right-5 flex items-center gap-x-2">
          <Button
            onClick={() => coverImage.onReplace(url)}
            className="text-muted-foreground text-xs"
            variant="outline"
            size="sm"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Change cover
          </Button>
          <Button
            onClick={onRemove}
            className="text-muted-foreground text-xs"
            variant="outline"
            size="sm"
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        </div>
      )}
    </div>
  );
};

/**
 * Skeleton component to be displayed while the cover image is loading.
 * @returns (React.FC) - cover image skeleton component
 */
Cover.Skeleton = function CoverSkeleton() {
  return <Skeleton className="w-full h-[12vh]" />;
};
