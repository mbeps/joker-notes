"use client";

import { useUser } from "@clerk/nextjs";
import { MoreHorizontal, Trash } from "lucide-react";
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
import type { Id } from "@/convex/_generated/dataModel";
import { useDocumentActions } from "@/hooks/use-document-actions";

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
  const { user } = useUser();
  const { archiveDocument } = useDocumentActions();

  /**
   * Archives the document and redirects back to the document list.
   */
  const onArchive = () => {
    archiveDocument(documentId);
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
