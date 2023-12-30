"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import React from "react";
import { Title } from "./Title";
import Banner from "./Banner";
import { Menu } from "./Menu";
import { MenuIcon } from "lucide-react";
import Publish from "./Publish";

interface NavbarProps {
  isCollapsed: boolean;
  onResetWidth: () => void;
}

/**
 * The navbar component displayed at the top of the document page.
 * This navbar is only displayed when a document is loaded.
 * This component is responsible for:
 * - Displaying and renaming the document title
 * - Publishing and unpublishing the document
 * - Displaying the document menu where the user can trigger various actions
 *
 * If the document is archived (in trash), a banner is displayed at the top of the page.
 * @param isCollapsed (boolean): Whether the navbar is collapsed or not
 * @param onResetWidth (function): Function to reset the width of the navbar
 * @returns (JSX.Element): The navbar component
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
      <nav
        className="
					bg-background dark:bg-[#1F1F1F] 
					px-3 py-2 
					w-full 
					flex 
					items-center justify-between
				"
      >
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
      <nav
        className="
					bg-background dark:bg-[#1F1F1F] 
					px-3 py-2 
					w-full 
					flex items-center 
					gap-x-4"
      >
        {isCollapsed && (
          <MenuIcon
            role="button"
            onClick={onResetWidth}
            className="h-6 w-6 text-muted-foreground"
          />
        )}
        <div className="flex items-center justify-between w-full">
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
