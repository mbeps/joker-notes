"use client";

import { ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";
import { useCoverImage } from "@/hooks/useCoverImage";
import { useCoverImageActions } from "@/hooks/useCoverImageActions";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

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
  const params = useParams();
  const coverImage = useCoverImage();
  const { removeCover } = useCoverImageActions();

  /**
   * Deletes the existing cover asset from Edge Store and clears it in Convex.
   */
  const onRemove = async () => {
    await removeCover(params.documentId as Id<"documents">, url);
  };

  return (
    <div
      className={cn(
        "group relative h-[35vh] w-full",
        !url && "h-[12vh]",
        url && "bg-muted",
      )}
    >
      {/* if there is cover image, display it */}
      {!!url && <Image src={url} fill alt="Cover" className="object-cover" />}

      {/* if there is cover image and document is editable */}
      {url && !preview && (
        <div className="absolute right-5 bottom-5 flex items-center gap-x-2 opacity-0 group-hover:opacity-100">
          <Button
            onClick={() => coverImage.onReplace(url)}
            className="text-muted-foreground text-xs"
            variant="outline"
            size="sm"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Change cover
          </Button>
          <Button
            onClick={onRemove}
            className="text-muted-foreground text-xs"
            variant="outline"
            size="sm"
          >
            <X className="mr-2 h-4 w-4" />
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
  return <Skeleton className="h-[12vh] w-full" />;
};
