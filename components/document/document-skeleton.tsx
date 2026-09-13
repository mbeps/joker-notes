import type React from "react";
import { Cover } from "@/components/image/cover";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for document views, replicating the cover image and text lines.
 * Displayed during Suspense transitions and initial data fetching.
 *
 * @returns Skeleton placeholder reflecting the document header and content structure.
 */
export const DocumentSkeleton: React.FC = () => {
  return (
    <div data-testid="document-skeleton">
      <Cover.Skeleton />
      <div className="mx-auto mt-10 md:max-w-3xl lg:max-w-4xl">
        <div className="space-y-4 pt-4 pl-8">
          <Skeleton className="h-14 w-[50%]" />
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-4 w-[40%]" />
          <Skeleton className="h-4 w-[60%]" />
        </div>
      </div>
    </div>
  );
};
