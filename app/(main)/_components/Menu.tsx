"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { MoreHorizontal, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPositioner,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Props passed to the document action menu containing the Convex document id.
 */
interface MenuProps {
  documentId: Id<"documents">;
}

/**
 * Document actions menu providing destructive options like moving a note to trash.
 * Integrates Clerk user data for audit feedback and Convex mutations for persistence.
 *
 * @param documentId Identifier of the document whose actions are exposed.
 * @returns Dropdown menu with destructive document actions and metadata.
 * @see https://docs.convex.dev/database/writing-data
 * @see https://clerk.com/docs/references/react/use-user
 */
export const Menu = ({ documentId }: MenuProps) => {
  const router = useRouter();
  const { user } = useUser();
  const archive = useMutation(api.documents.archive);

  /**
   * Archives the document and redirects back to the document list.
   */
  const onArchive = () => {
    const promise = archive({ id: documentId });

    toast.promise(promise, {
      loading: "Moving to trash...",
      success: "Note moved to trash!",
      error: "Failed to archive note.",
    });

    router.push("/documents");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="sm" variant="ghost" />}>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuPositioner align="end" alignOffset={8}>
        <DropdownMenuContent className="w-60">
          <DropdownMenuItem onClick={onArchive}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="p-2 text-muted-foreground text-xs">
            Last edited by: {user?.fullName}
          </div>
        </DropdownMenuContent>
      </DropdownMenuPositioner>
    </DropdownMenu>
  );
};

/**
 * Skeleton placeholder for the menu button while document metadata loads.
 */
Menu.Skeleton = function MenuSkeleton() {
  return <Skeleton className="h-10 w-10" />;
};
