"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { PlusCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

/**
 * Empty state page shown when the user has not selected a document.
 * Invites them to create a new note using the Convex documents API.
 *
 * @returns Empty state with imagery and a button to create a document.
 * @see https://docs.convex.dev/database/writing-data
 * @see https://clerk.com/docs/references/react/use-user
 */
const DocumentPage: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();
  // document.api follows the structure in the convex folder
  /**
   * Create a new document with the title "Untitled".
   * The `create` function is from the Convex API.
   */
  const create = useMutation(api.documents.create);

  /**
   * Persists a blank document and navigates to its editor route.
   */
  const onCreate = () => {
    const promise = create({ title: "Untitled" }).then((documentId) =>
      router.push(`/documents/${documentId}`)
    );

    toast.promise(promise, {
      loading: "Creating a new note...",
      success: "New note created!",
      error: "Failed to create a new note.",
    });
  };

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">
      <Image
        src="/empty/empty-light.png"
        height="300"
        width="300"
        alt="Empty"
        className="dark:hidden"
      />
      <Image
        src="/empty/empty-dark.png"
        height="300"
        width="300"
        alt="Empty"
        className="hidden dark:block"
      />
      <h2 className="text-lg font-medium">
        {`Welcome to ${user?.firstName}'s Joker`}
      </h2>
      <Button onClick={onCreate}>
        <PlusCircle className="h-4 w-4 mr-2" />
        Create a note
      </Button>
    </div>
  );
};
export default DocumentPage;
