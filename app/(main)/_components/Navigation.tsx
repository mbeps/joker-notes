"use client";

import {
  ChevronsLeft,
  MenuIcon,
  Plus,
  PlusCircle,
  Search,
  Settings,
  Trash,
} from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import type React from "react";
import {
  type ElementRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useMediaQuery } from "usehooks-ts";
import {
  Popover,
  PopoverContent,
  PopoverPositioner,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDocumentActions } from "@/hooks/useDocumentActions";
import { useSearch } from "@/hooks/useSearch";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import DocumentList from "./DocumentList";
import { Item } from "./Item";
import Navbar from "./Navbar";
import TrashBox from "./TrashBox";
import UserItem from "./UserItem";

/**
 * Collapsible workspace sidebar that surfaces navigation, shortcuts, and trash management.
 * Persists panel width across breakpoints and uses Convex mutations for document creation.
 *
 * @returns Sidebar navigation shell responsive to viewport size and route changes.
 * @see https://docs.convex.dev/database/writing-data
 */
const Navigation: React.FC = () => {
  const settings = useSettings();
  const search = useSearch();
  const params = useParams();
  const _pathname = usePathname();
  const { createDocument } = useDocumentActions();
  /**
   * Tracks whether the viewport should use the mobile collapsed experience.
   */
  const isMobile = useMediaQuery("(max-width: 768px)");

  const isResizingRef = useRef(false);
  const sidebarRef = useRef<ElementRef<"aside">>(null);
  const navbarRef = useRef<ElementRef<"div">>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(isMobile);

  /**
   * Restores the sidebar to its default width, expanding it on desktop.
   */
  const resetWidth = useCallback(() => {
    if (sidebarRef.current && navbarRef.current) {
      setIsCollapsed(false);
      setIsResetting(true);

      sidebarRef.current.style.width = isMobile ? "100%" : "240px";
      navbarRef.current.style.setProperty(
        "width",
        isMobile ? "0" : "calc(100% - 240px)",
      );
      navbarRef.current.style.setProperty("left", isMobile ? "100%" : "240px");
      setTimeout(() => setIsResetting(false), 300);
    }
  }, [isMobile]);

  /**
   * Collapses the sidebar so content can take the full viewport width.
   */
  const collapse = useCallback(() => {
    if (sidebarRef.current && navbarRef.current) {
      setIsCollapsed(true);
      setIsResetting(true);

      sidebarRef.current.style.width = "0";
      navbarRef.current.style.setProperty("width", "100%");
      navbarRef.current.style.setProperty("left", "0");
      setTimeout(() => setIsResetting(false), 300);
    }
  }, []);

  // collapse sidebar on mobile or expand sidebar on desktop
  useEffect(() => {
    if (isMobile) {
      collapse();
    } else {
      resetWidth();
    }
  }, [isMobile, collapse, resetWidth]);

  // on mobile, automatically collapse the sidebar when the user navigates to a new page
  useEffect(() => {
    if (isMobile) {
      collapse();
    }
  }, [isMobile, collapse]);

  /**
   * Begins sidebar resizing by listening for subsequent mouse events.
   */
  const handleMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    isResizingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // resize sidebar
  /**
   * Adjusts the sidebar width while enforcing min and max bounds.
   */
  const handleMouseMove = (event: MouseEvent) => {
    if (!isResizingRef.current) return;
    let newWidth = event.clientX;

    if (newWidth < 240) newWidth = 240; // min width
    if (newWidth > 480) newWidth = 480; // max width

    if (sidebarRef.current && navbarRef.current) {
      sidebarRef.current.style.width = `${newWidth}px`;
      navbarRef.current.style.setProperty("left", `${newWidth}px`);
      navbarRef.current.style.setProperty(
        "width",
        `calc(100% - ${newWidth}px)`,
      );
    }
  };

  /**
   * Ends the resize interaction and removes temporary listeners.
   */
  const handleMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  /**
   * Creates a new document with a default title and navigates to it once saved.
   */
  const handleCreate = () => {
    createDocument();
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          "group/sidebar relative z-40 flex h-full w-60 flex-col overflow-y-auto bg-secondary p-3",
          isCollapsed && "p-0",
          isResetting && "transition-all duration-300 ease-in-out",
          isMobile && "w-0 p-0",
        )}
      >
        <div
          onClick={collapse}
          role="button"
          className={cn(
            "absolute top-3 right-2 h-6 w-6 rounded-sm text-muted-foreground opacity-0 transition hover:bg-neutral-300 group-hover/sidebar:opacity-100 dark:hover:bg-neutral-600",
            isMobile && "opacity-100",
          )}
        >
          <ChevronsLeft className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <UserItem />
          <Item label="Search" icon={Search} isSearch onClick={search.onOpen} />
          <Item label="Settings" icon={Settings} onClick={settings.onOpen} />
          <Item onClick={handleCreate} label="New page" icon={PlusCircle} />
        </div>
        <div className="mt-4 space-y-1">
          <DocumentList />
          <Item onClick={handleCreate} icon={Plus} label="Add a page" />
          <Popover>
            <PopoverTrigger className="mt-4 w-full">
              <Item label="Trash" icon={Trash} />
            </PopoverTrigger>
            <PopoverPositioner side={isMobile ? "bottom" : "right"}>
              <PopoverContent className="w-72 p-0">
                <TrashBox />
              </PopoverContent>
            </PopoverPositioner>
          </Popover>
        </div>
        <div
          onMouseDown={handleMouseDown}
          onClick={resetWidth}
          className="absolute top-0 right-0 h-full w-1 cursor-ew-resize bg-primary/10 opacity-0 transition group-hover/sidebar:opacity-100"
        />
      </aside>
      <div
        ref={navbarRef}
        className={cn(
          "absolute top-0 left-60 z-40 w-[calc(100%-240px)]",
          isResetting && "transition-all duration-300 ease-in-out",
          isMobile && "left-0 w-full",
        )}
      >
        {params.documentId ? (
          <Navbar isCollapsed={isCollapsed} onResetWidth={resetWidth} />
        ) : (
          <nav className="w-full bg-transparent px-3 py-2">
            {isCollapsed && (
              <MenuIcon
                onClick={resetWidth}
                role="button"
                className="h-6 w-6 text-muted-foreground"
              />
            )}
          </nav>
        )}
      </div>
    </>
  );
};

export default Navigation;
