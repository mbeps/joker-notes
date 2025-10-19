"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import React, { useRef, useState } from "react";

/**
 * Props for the editable document title component.
 */
interface TitleProps {
  initialData: Doc<"documents">;
}

/**
 * Inline document title editor that persists changes through Convex in real time.
 * Supports toggling between read-only and input modes with keyboard shortcuts.
 *
 * @param initialData Document data whose title will be displayed and edited.
 * @returns Inline title control supporting quick edits.
 * @see https://docs.convex.dev/database/writing-data
 */
export const Title = ({ initialData }: TitleProps) => {
  /**
   * Ref to the input element.
   * Used to focus the input when the user clicks on the title.
   */
  const inputRef = useRef<HTMLInputElement>(null);
  const update = useMutation(api.documents.update);

  // keeps track of the title of the document
  const [title, setTitle] = useState(initialData.title || "Untitled");
  // keeps track of whether the title is being edited
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Opens the title input and focuses it so users can immediately type.
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
   * Returns the component to its button state.
   */
  const disableInput = () => {
    setIsEditing(false);
  };

  /**
   * Saves the latest text input to Convex while updating local state.
   *
   * @param event Input change event from the title field.
   */
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value); // updates the title of the document
    update({
      id: initialData._id, // the ID of the document to update
      title: event.target.value || "Untitled", // the title of the document
    });
  };

  /**
   * Closes the input on Enter to mirror Notion-style interactions.
   *
   * @param event Keyboard event emitted from the title input.
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

/**
 * Skeleton placeholder rendered while the document title loads.
 *
 * @returns Placeholder matching the title dimensions.
 */
Title.Skeleton = function TitleSkeleton() {
  return <Skeleton className="h-9 w-20 rounded-md" />;
};
