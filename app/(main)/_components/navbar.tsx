"use client";

import { useQuery } from "convex/react";
import { MenuIcon } from "lucide-react";
import { useParams } from "next/navigation";
import type React from "react";
import Banner from "@/app/(main)/_components/banner";
import { Menu } from "@/app/(main)/_components/menu";
import Publish from "@/app/(main)/_components/publish";
import { Title } from "@/app/(main)/_components/title";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Props for the document navbar component rendered within the workspace layout.
 */
interface NavbarProps {
  isCollapsed: boolean;
  onResetWidth: () => void;
}

/**
 * Workspace navbar that surfaces document level actions such as renaming and publishing.
 * Loads document metadata via Convex queries and shows an archived banner when needed.
 *
 * @param isCollapsed Whether the sidebar is collapsed, used to conditionally show the menu icon.
 * @param onResetWidth Callback that restores the sidebar width when the menu icon is pressed.
 * @returns Document toolbar for the active page or null when the document is missing.
 * @see https://docs.convex.dev/database/queries
 */
const Navbar: React.FC<NavbarProps> = ({ isCollapsed, onResetWidth }) => {
  /**
   * Fetch the document by its ID.
   */
  const params = useParams();

  /**
   * Fetch the document by its ID.
   * The data from the document is then used to display the document title, and publish/unpublish the document.
   */
  const document = useQuery(api.documents.getById, {
    documentId: params.documentId as Id<"documents">,
  });

  // If the document is undefined, it means it is loading.
  if (document === undefined) {
    return (
      <nav className="flex w-full items-center justify-between bg-background px-3 py-2 dark:bg-[#1F1F1F]">
        <Title.Skeleton />
        <div className="flex items-center gap-x-2">
          <Menu.Skeleton />
        </div>
      </nav>
    );
  }

  // If the document is null, it means it does not exist.
  if (document === null) {
    return null;
  }

  return (
    <>
      <nav className="flex w-full items-center gap-x-4 bg-background px-3 py-2 dark:bg-[#1F1F1F]">
        {isCollapsed && (
          <MenuIcon
            role="button"
            onClick={onResetWidth}
            className="h-6 w-6 text-muted-foreground"
          />
        )}
        <div className="flex w-full items-center justify-between">
          <Title initialData={document} />
          <div className="flex items-center gap-x-2">
            <Publish initialData={document} />
            <Menu documentId={document._id} />
          </div>
        </div>
      </nav>
      {document.isArchived && <Banner documentId={document._id} />}
    </>
  );
};

export default Navbar;
