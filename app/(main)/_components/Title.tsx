"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import React, { useRef, useState } from "react";

interface TitleProps {
  initialData: Doc<"documents">;
}

/**
 * Title component which displays the title of the document.
 * It also allows the user to edit the title.
 * @param initialData (Doc<"documents">) - The initial data of the document.
 * @returns (JSX.Element) - The title of the document.
 */
export const Title = ({ initialData }: TitleProps) => {
  /**
   * Ref to the input element.
   * Used to focus the input when the user clicks on the title.
   */
  const inputRef = useRef<HTMLInputElement>(null);
  /**
   * Allows updating a document.
   * Uses the `update` mutation from the `documents` API from Convex.
   */
  const update = useMutation(api.documents.update);

  // keeps track of the title of the document
  const [title, setTitle] = useState(initialData.title || "Untitled");
  // keeps track of whether the title is being edited
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Enables the input to edit the title.
   * Initially, the component being displayed is not an input.
   * Once it is clicked, the component becomes an input allowing the user to edit the title.
   */
  const enableInput = () => {
    setTitle(initialData.title);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(0, inputRef.current.value.length);
    }, 0);
  };

  /**
   * Disables the input to edit the title.
   * Once the input is disabled, the component becomes a button again.
   */
  const disableInput = () => {
    setIsEditing(false);
  };

  /**
   * Updates the title of the document.
   * It takes the value of the input and updates the title of the document.
   * Uses the update mutation from the Convex API.
   * @param event (React.ChangeEvent<HTMLInputElement>) - The event that triggered the function.
   */
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value); // updates the title of the document
    update({
      id: initialData._id, // the ID of the document to update
      title: event.target.value || "Untitled", // the title of the document
    });
  };

  /**
   * Disables the input when the user presses the Enter key.
   * @param event (React.KeyboardEvent<HTMLInputElement>) - The event that triggered the function.
   */
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      disableInput();
    }
  };

  return (
    <div className="flex items-center gap-x-1">
      {!!initialData.icon && <p>{initialData.icon}</p>}
      {isEditing ? (
        <Input
          ref={inputRef}
          onClick={enableInput}
          onBlur={disableInput}
          onChange={onChange}
          onKeyDown={onKeyDown}
          value={title}
          className="h-7 px-2 focus-visible:ring-transparent"
        />
      ) : (
        <Button
          onClick={enableInput}
          variant="ghost"
          size="sm"
          className="font-normal h-auto p-1"
        >
          <span className="truncate">{initialData?.title}</span>
        </Button>
      )}
    </div>
  );
};

Title.Skeleton = function TitleSkeleton() {
  return <Skeleton className="h-9 w-20 rounded-md" />;
};
