"use client";

import { api } from "@/convex/_generated/api";
import { useSearch } from "@/hooks/useSearch";
import { useUser } from "@clerk/nextjs";
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

/**
 * Command palette that lets authenticated users jump between accessible documents.
 * Pulls live data from Convex `documents.getSearch` while reusing Clerk session context.
 *
 * @returns Command dialog that appears once the client hydrates.
 * @see https://docs.convex.dev/database/queries
 * @see https://clerk.com/docs/references/react/use-user
 */
const SearchCommand: React.FC = () => {
  const { user } = useUser(); // Clerk user currently logged in
  const router = useRouter();
  const documents = useQuery(api.documents.getSearch);
  const [isMounted, setIsMounted] = useState(false);
  const toggle = useSearch((store) => store.toggle);
  const isOpen = useSearch((store) => store.isOpen);
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
   * Navigates to the selected document and closes the command palette.
   * Keeps keyboard driven navigation snappy by reusing Next.js app router.
   *
   * @param {string} id Identifier of the selected document.
   * @see https://nextjs.org/docs/app/api-reference/functions/use-router
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
      <CommandInput placeholder={`Search ${user?.fullName}'s Joker Notes...`} />
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
