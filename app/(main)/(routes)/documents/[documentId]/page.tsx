"use client";

import { Cover } from "@/components/Images/Cover";
import Toolbar from "@/components/Toolbars/Toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import dynamic from "next/dynamic";
import React, { useMemo } from "react";

// Params types are async in Next.js 15; keep a permissive `any` here for the
// client page so the component can continue to read params synchronously.
type DocumentPageProps = {
  params: any;
};

/**
 * Document page where documents are displayed.
 * Documents can be modified by the user.
 * Only the owner of the document can modify the document (as implemented by `MainLayout`)
 * @param documentId (string): The ID of the document to be fetched
 * @returns (JSX.Element): The document page
 */
const DocumentPage: React.FC<DocumentPageProps> = ({ params }) => {
  /**
   * Dynamically import the editor component to prevent it from being bundled.
   * The editor cannot be rendered by the server.
   */
  const Editor = useMemo(
    () => dynamic(() => import("@/components/Editors/Editor"), { ssr: false }),
    []
  );

  /**
   * Fetch the document by its ID.
   * The document to be fetched is the currently opened one.
   * The ID of the currently opened document is read from the URL params.
   */
  const document = useQuery(api.documents.getById, {
    documentId: params.documentId,
  });

  /**
   * Update the document by its ID.
   * The document to be updated is the currently opened one.
   * The ID of the currently opened document is read from the URL params.
   */
  const update = useMutation(api.documents.update);

  /**
   * Updates the content of the document.
   * The ID remains the same.
   * The content includes:
   * - The title of the document
   * - Whether the document is archived (in trash)
   * - Parent documents (if any)
   * - The content of the document
   * - Cover image of the document
   * - Icon of the document
   * - Whether the document is shared or not
   * @param content (string): The content of the document
   */
  const onChange = (content: string) => {
    update({
      id: params.documentId,
      content,
    });
  };

  // while the document is being fetched display a skeleton loading animation
  if (document === undefined) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="md:max-w-3xl lg:max-w-4xl mx-auto mt-10">
          <div className="space-y-4 pl-8 pt-4">
            <Skeleton className="h-14 w-[50%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
      </div>
    );
  }

  // if the document does not exist display a message
  if (document === null) {
    return <div>Not found</div>;
  }

  return (
    <div className="pb-40">
      <Cover url={document.coverImage} />
      <div className="md:max-w-3xl lg:max-w-4xl mx-auto">
        <Toolbar initialData={document} />
        <Editor onChange={onChange} initialContent={document.content} />
      </div>
    </div>
  );
};

export default DocumentPage;
