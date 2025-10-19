"use client";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";
import { Item } from "./Item";
import { cn } from "@/lib/utils";
import { FileIcon } from "lucide-react";

/**
 * Props accepted by the recursive document list renderer.
 */
interface DocumentListProps {
  parentDocumentId?: Id<"documents">;
  level?: number;
  data?: Doc<"documents">[];
}

/**
 * Recursive sidebar tree that renders the user's document hierarchy.
 * Loads sibling nodes via Convex queries and toggles nested lists on demand.
 *
 * @param parentDocumentId Parent document used to scope the list.
 * @param level Nesting depth for indentation.
 * @returns Hierarchical list of documents for the active user.
 * @see https://docs.convex.dev/database/queries
 */
const DocumentList: React.FC<DocumentListProps> = ({
  parentDocumentId,
  level = 0,
}) => {
  const params = useParams();
  const router = useRouter();
  // keeps track of which documents are expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  /**
   * Toggles the expanded state for a document id.
   *
   * @param {string} documentId Document identifier whose expanded state should flip.
   */
  const onExpand = (documentId: string) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [documentId]: !prevExpanded[documentId],
    }));
  };

  /**
   * Fetches the documents from the database.
   */
  const documents = useQuery(api.documents.getSidebar, {
    parentDocument: parentDocumentId,
  });

  /**
   * Navigates to the requested document route.
   *
   * @param {string} documentId Document identifier to navigate to.
   */
  const onRedirect = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  if (documents === undefined) {
    // undefined means loading
    return (
      <>
        <Item.Skeleton level={level} />
        {level === 0 && (
          <>
            <Item.Skeleton level={level} />
            <Item.Skeleton level={level} />
          </>
        )}
      </>
    );
  }

  return (
    <>
      <p
        style={{
          paddingLeft: level ? `${level * 12 + 25}px` : undefined,
        }}
        className={cn(
          "hidden text-sm font-medium text-muted-foreground/80",
          expanded && "last:block",
          level === 0 && "hidden"
        )}
      >
        No pages inside
      </p>
      {documents.map((document) => (
        <div key={document._id}>
          <Item
            id={document._id}
            onClick={() => onRedirect(document._id)}
            label={document.title}
            icon={FileIcon}
            documentIcon={document.icon}
            active={params.documentId === document._id}
            level={level}
            onExpand={() => onExpand(document._id)}
            expanded={expanded[document._id]}
          />
          {expanded[document._id] && (
            <DocumentList parentDocumentId={document._id} level={level + 1} />
          )}
        </div>
      ))}
    </>
  );
};

export default DocumentList;
