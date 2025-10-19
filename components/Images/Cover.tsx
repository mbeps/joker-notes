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

/**
 * Props controlling the cover image display, including optional preview mode.
 */
interface CoverImageProps {
  url?: string;
  preview?: boolean;
}

/**
 * Displays the document cover image with controls for replacing or removing it when editable.
 * Coordinates Edge Store uploads with Convex metadata updates.
 *
 * @param url The current cover image URL to display.
 * @param preview When true, hides editing controls for read-only previews.
 * @returns The cover image region with optional management actions.
 * @see https://docs.edgestore.dev
 * @see https://docs.convex.dev/database/writing-data
 */
export const Cover = ({ url, preview }: CoverImageProps) => {
  const { edgestore } = useEdgeStore();
  const params = useParams();
  const coverImage = useCoverImage();
  /**
   * Convex mutation that clears the cover image reference for this document.
   */
  const removeCoverImage = useMutation(api.documents.removeCoverImage);

  /**
   * Deletes the existing cover asset from Edge Store and clears it in Convex.
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
        url && "bg-muted"
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
 * Skeleton placeholder shown while the cover image loads.
 *
 * @returns {JSX.Element} Placeholder block that mimics the cover layout.
 */
Cover.Skeleton = function CoverSkeleton() {
  return <Skeleton className="w-full h-[12vh]" />;
};
