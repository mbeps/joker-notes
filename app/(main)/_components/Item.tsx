import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import {
  ChevronDown,
  ChevronRight,
  LucideIcon,
  MoreHorizontal,
  Plus,
  Trash,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

interface ItemProps {
  id?: Id<"documents">;
  documentIcon?: string;
  active?: boolean;
  expanded?: boolean;
  isSearch?: boolean;
  level?: number;
  onExpand?: () => void;
  label: string;
  onClick?: () => void;
  icon: LucideIcon;
}

/**
 * An item that can be clicked on in the sidebar.
 * This item can be used to:
 * - Display, navigate and manage documents
 * - Display and interact with any other item in the sidebar
 * @param id (string): The ID of the document.
 * @param documentIcon (string): The icon to display next to the document.
 * @param active (boolean): Whether the document is active.
 * @param expanded (boolean): Whether the document is expanded.
 * @param isSearch (boolean): Whether the item is a search button.
 * @param level (number): The level of the document in the hierarchy.
 * @param onExpand (function): Expands or collapses a document.
 * @param label (string): The label of the document.
 * @param onClick (function): Function to call when the item is clicked.
 * @param icon (LucideIcon) The icon to display next to the document.
 * @returns (JSX.Element): A document in the sidebar.
 */
export const Item = ({
  id,
  label,
  onClick,
  icon: Icon,
  active,
  documentIcon,
  isSearch,
  level = 0,
  onExpand,
  expanded,
}: ItemProps) => {
  /**
   * User currently logged in.
   * Provided by Clerk.
   */
  const { user } = useUser();
  /**
   * Allows redirecting to another page.
   */
  const router = useRouter();
  /**
   * Allows creating a new document.
   */
  const create = useMutation(api.documents.create);
  /**
   * Allows archiving a document (moving it to trash).
   */
  const archive = useMutation(api.documents.archive);

  /**
   * Archives (moves to trash) a document.
   * The document is not deleted permanently but rather marked as archived.
   * @param event (React.MouseEvent<HTMLDivElement, MouseEvent>) The event that triggered the function (clicking on the trash icon).
   * @returns (void): exist if the document ID is undefined.
   */
  const onArchive = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation(); // prevents the event from bubbling up to the parent element
    if (!id) return; // exist if the document ID is undefined
    const promise = archive({ id }).then(() => router.push("/documents")); // archives the document and redirects to the documents page

    // displays a toast notification
    toast.promise(promise, {
      loading: "Moving to trash...",
      success: "Note moved to trash!",
      error: "Failed to archive note.",
    });
  };

  /**
   * Expands documents to show nested documents.
   * @param event (React.MouseEvent<HTMLDivElement, MouseEvent>) The event that triggered the function (clicking on the expand icon).
   */
  const handleExpand = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    event.stopPropagation(); // prevents the event from bubbling up to the parent element
    onExpand?.(); // calls the onExpand function passed as a prop
  };

  /**
   * Allows creating a new document.
   * @param event (React.MouseEvent<HTMLDivElement, MouseEvent>) The event that triggered the function (clicking on the plus icon
   * @returns (void): exist if the document ID is undefined (no parent document
   */
  const onCreate = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation(); // prevents the event from bubbling up to the parent element
    if (!id) return; // exist if the document ID is undefined (no parent document)
    const promise = create({ title: "Untitled", parentDocument: id }).then(
      // creates a new document with the title "Untitled" and the current document as the parent document
      (documentId) => {
        if (!expanded) {
          onExpand?.(); // expands the current document if it is not expanded
        }
        router.push(`/documents/${documentId}`); // redirects to the new document
      },
    );

    toast.promise(promise, {
      loading: "Creating a new note...",
      success: "New note created!",
      error: "Failed to create a new note.",
    });
  };

  /**
   * Icon to display next to the document.
   * If the document is expanded, the icon is a chevron pointing down.
   * If the document is collapsed, the icon is a chevron pointing right.
   */
  const ChevronIcon = expanded ? ChevronDown : ChevronRight;

  return (
    <div
      onClick={onClick}
      role="button"
      style={{
        paddingLeft: level ? `${level * 12 + 12}px` : "12px",
      }}
      className={cn(
        "group min-h-[30px] text-sm py-2 pr-3 w-full hover:bg-primary/5 flex items-center text-muted-foreground font-medium rounded-lg",
        active && "bg-primary/5 text-primary",
      )}
    >
      {!!id && (
        <div
          role="button"
          className="h-full rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 mr-1"
          onClick={handleExpand}
        >
          <ChevronIcon className="h-4 w-4 shrink-0 text-muted-foreground/50" />
        </div>
      )}
      {documentIcon ? (
        <div className="shrink-0 mr-2 text-[18px]">{documentIcon}</div>
      ) : (
        <Icon className="shrink-0 h-[18px] w-[18px] mr-2 text-muted-foreground" />
      )}
      <span className="truncate">{label}</span>
      {isSearch && (
        <kbd
          className="
						ml-auto 
						pointer-events-none 
						inline-flex h-5 
						select-none 
						items-center 
						gap-1 
						rounded-full
						border 
						bg-muted 
						px-1.5 
						font-mono text-[10px] font-medium text-muted-foreground 
						opacity-100"
        >
          <span className="text-xs">⌘</span>K
        </kbd>
      )}
      {!!id && (
        <div className="ml-auto flex items-center gap-x-2">
          {/* Delete Note */}
          <DropdownMenu>
            <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} asChild>
              <div
                role="button"
                className="
									opacity-0 group-hover:opacity-100
									h-full
									ml-auto
									rounded-sm
									hover:bg-neutral-300 dark:hover:bg-neutral-600
									"
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-60"
              align="start"
              side="right"
              forceMount
            >
              <DropdownMenuItem onClick={onArchive}>
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="text-xs text-muted-foreground p-2">
                Last edited by: {user?.fullName}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create Note */}
          <div
            role="button"
            onClick={onCreate}
            className="opacity-0 group-hover:opacity-100 h-full ml-auto rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );
};

Item.Skeleton = function ItemSkeleton({ level }: { level?: number }) {
  return (
    <div
      style={{
        paddingLeft: level ? `${level * 12 + 25}px` : "12px",
      }}
      className="flex gap-x-2 py-[3px]"
    >
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-[30%]" />
    </div>
  );
};