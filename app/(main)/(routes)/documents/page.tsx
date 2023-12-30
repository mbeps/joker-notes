"use client";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { PlusCircle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

/**
 * Document page where published documents are displayed.
 * Published documents cannot be modified.
 * @returns (JSX.Element): The document page
 */
const DocumentPage: React.FC = () => {
  /**
   * Router allowing page to navigate to other pages.
   */
  const router = useRouter();
  /**
   * Currently logged in user from Clerk.
   */
  const { user } = useUser();
  // document.api follows the structure in the convex folder
  /**
   * Create a new document with the title "Untitled".
   * The `create` function is from the Convex API.
   */
  const create = useMutation(api.documents.create);

  /**
   * Creates a new document with the title "Untitled".
   * This document is saved in the Convex database.
   * Once the document is created, the user is redirected to the document page.
   * The toast is used to display a message to the user.
   */
  const onCreate = () => {
    const promise = create({ title: "Untitled" }).then((documentId) =>
      router.push(`/documents/${documentId}`),
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
