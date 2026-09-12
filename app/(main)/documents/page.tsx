"use client";

import { useUser } from "@clerk/nextjs";
import { PlusCircle } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { Button } from "@/components/ui/button";
import { ASSETS } from "@/config/assets";
import { useDocumentActions } from "@/hooks/use-document-actions";

/**
 * Empty state page shown when the user has not selected a document.
 * Invites them to create a new note using the Convex documents API.
 *
 * @returns Empty state with imagery and a button to create a document.
 * @see https://docs.convex.dev/database/writing-data
 * @see https://clerk.com/docs/references/react/use-user
 */
const DocumentPage: React.FC = () => {
  const { user } = useUser();
  const { createDocument } = useDocumentActions();

  /**
   * Persists a blank document and navigates to its editor route.
   */
  const onCreate = () => {
    createDocument();
  };

  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <Image
        src={ASSETS.EMPTY.LIGHT}
        height="300"
        width="300"
        alt="Empty"
        className="dark:hidden"
      />
      <Image
        src={ASSETS.EMPTY.DARK}
        height="300"
        width="300"
        alt="Empty"
        className="hidden dark:block"
      />
      <h2 className="font-medium text-lg">
        {`Welcome to ${user?.firstName}'s Joker`}
      </h2>
      <Button onClick={onCreate}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Create a note
      </Button>
    </div>
  );
};

export default DocumentPage;
