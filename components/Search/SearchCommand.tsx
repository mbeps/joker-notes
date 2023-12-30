"use client";

import { api } from "@/convex/_generated/api";
import { useSearch } from "@/hooks/useSearch";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { File } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";

const SearchCommand: React.FC = () => {
  const { user } = useUser(); // Clerk user currently logged in
  const router = useRouter();
  /**
   * List of documents that match the search query.
   * This calls the documents.getSearch API from the Convex API.
   * This only returns documents that the user has access to, and are not archived (in trash).
   */
  const documents = useQuery(api.documents.getSearch);
  const [isMounted, setIsMounted] = useState(false);

  /**
   * The toggle function is used to toggle the search dialog.
   * This is used to open and close the search dialog.
   */
  const toggle = useSearch((store) => store.toggle);
  /**
   * The isOpen state is used to determine whether the search dialog is open.
   */
  const isOpen = useSearch((store) => store.isOpen);
  /**
   * The onClose function is used to close the search dialog.
   */
  const onClose = useSearch((store) => store.onClose);

  // prevents hydration by preventing server rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // keyboard shortcut
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [toggle]);

  /**
   * The onSelect function is used to select a document from the search results.
   * This is used to navigate to the document page.
   * @param id (string): The document ID
   */
  const onSelect = (id: string) => {
    router.push(`/documents/${id}`);
    onClose();
  };

  // prevents hydration by preventing server rendering
  if (!isMounted) {
    return null;
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput placeholder={`Search ${user?.fullName}'s Motion...`} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Documents">
          {/* List of searched documents */}
          {documents?.map((document) => (
            <CommandItem
              key={document._id}
              value={`${document._id}-${document.title}`}
              title={document.title}
              onSelect={() => onSelect(document._id)}
            >
              {document.icon ? (
                <p className="mr-2 text-[18px]">{document.icon}</p>
              ) : (
                <File className="mr-2 h-4 w-4" />
              )}
              <span>{document.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
export default SearchCommand;
