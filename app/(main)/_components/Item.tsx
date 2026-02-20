import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPositioner,
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
import { Kbd } from "@/components/ui/kbd";

/**
 * Props supplied to a sidebar item representing navigation actions or documents.
 */
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
 * Sidebar row that handles navigation, search, and document management affordances.
 * Integrates Convex mutations for document CRUD and Clerk metadata for audit info.
 *
 * @param id Document identifier rendered by the row.
 * @param label Label displayed for the row.
 * @param  onClick Handler invoked when the row is activated.
 * @param icon Icon displayed when no custom document icon exists.
 * @param active Whether the row represents the currently viewed document.
 * @param documentIcon Custom emoji icon for the document.
 * @param isSearch Whether the item triggers the global search command.
 * @param level Nesting depth used to compute indentation.
 * @param onExpand Callback that toggles expansion for nested documents.
 * @param expanded Indicates whether the current document is expanded.
 * @returns Sidebar item row containing the supplied metadata and controls.
 * @see https://docs.convex.dev/database/writing-data
 * @see https://clerk.com/docs/references/react/use-user
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
  const { user } = useUser();
  const router = useRouter();
  const create = useMutation(api.documents.create);
  const archive = useMutation(api.documents.archive);

  /**
   * Sends the current document to the Convex trash archive and shows toast feedback.
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
   * Notifies parent components to toggle nested document visibility.
   */
  const handleExpand = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    event.stopPropagation(); // prevents the event from bubbling up to the parent element
    onExpand?.(); // calls the onExpand function passed as a prop
  };

  /**
   * Creates a nested document beneath the current one and navigates to it.
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
      }
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
        active && "bg-primary/5 text-primary"
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
            space-x-1"
        >
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
          <span>{"/ "}</span>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </kbd>
      )}
      {!!id && (
        <div className="ml-auto flex items-center gap-x-2">
          {/* Delete Note */}
          <DropdownMenu>
            <DropdownMenuTrigger 
              onClick={(e) => e.stopPropagation()} 
              className="
									opacity-0 group-hover:opacity-100
									h-full
									ml-auto
									rounded-sm
									hover:bg-neutral-300 dark:hover:bg-neutral-600
									"
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuPositioner align="start" side="right">
              <DropdownMenuContent
                className="w-60"
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
            </DropdownMenuPositioner>
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

/**
 * Skeleton placeholder rendered while document items load.
 */
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
