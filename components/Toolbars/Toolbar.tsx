"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ImageIcon, Smile, X } from "lucide-react";
import React, { ElementRef, useRef, useState } from "react";
import { Button } from "../ui/button";
import { api } from "@/convex/_generated/api";
import IconPicker from "../Icon/IconPicker";
import TextareaAutosize from "react-textarea-autosize";
import { useCoverImage } from "@/hooks/useCoverImage";

interface ToolbarProps {
  initialData: Doc<"documents">;
  preview?: boolean;
}

/**
 * Toolbar component for the document title.
 * This toolbar is rendered at the top of the document where the title is displayed.
 * If the document is in preview mode:
 * - The title is not editable
 * - The icon is not editable
 * - The cover image is not editable
 * If the document is not in preview mode:
 * - The title is editable
 * - The icon is editable
 * - The cover image is editable
 *
 * @param initialData (Doc<"documents">) - The document data
 * @param preview (boolean) - Whether the document is in preview mode
 * @returns (React.FC<ToolbarProps>) - The toolbar component
 */
const Toolbar: React.FC<ToolbarProps> = ({ initialData, preview }) => {
  /**
   * The input ref is used to focus the input when the user clicks on the title.
   */
  const inputRef = useRef<ElementRef<"textarea">>(null);
  /**
   * The isEditing state is used to determine whether the title is being edited.
   * If the title is being edited, the input is displayed.
   */
  const [isEditing, setIsEditing] = useState(false);
  /**
   * The value state is used to store the title value.
   * This state is used to update the title in the database.
   */
  const [value, setValue] = useState(initialData.title);

  /**
   * The update mutation is used to update the document in the database.
   * This calls the documents.update API from the Convex API.
   */
  const update = useMutation(api.documents.update);
  /**
   * The removeIcon mutation is used to remove the icon from the document in the database.
   * This calls the documents.removeIcon API from the Convex API.
   */
  const removeIcon = useMutation(api.documents.removeIcon);

  /**
   * The coverImage hook is used to add a cover image to the document.
   * This hook is used to open the cover image modal.
   * This modal also allows the user to replace the cover image.
   */
  const coverImage = useCoverImage();

  /**
   * Enables the input and focuses it.
   * This function is called when the user clicks on the title.
   * @returns (void) - Enables the input and focuses it.
   */
  const enableInput = () => {
    if (preview) return;

    setIsEditing(true);
    setTimeout(() => {
      setValue(initialData.title);
      inputRef.current?.focus();
    }, 0);
  };

  /**
   * Disables the input.
   * This function is called when the user clicks outside of the input or presses the enter key.
   * @returns (void) - Disables the input.
   */
  const disableInput = () => setIsEditing(false);

  /**
   * Updates the title value and calls the update mutation.
   * If the input is empty, the title is set to "Untitled".
   * If the input is not empty, the title is set to the input value.
   * @param value (string) - The title value
   */
  const onInput = (value: string) => {
    setValue(value);
    update({
      id: initialData._id,
      title: value || "Untitled",
    });
  };

  /**
   * Prevents the default behaviour of the enter key.
   * Disables the input when the user presses the enter key.
   * @param event (React.KeyboardEvent<HTMLTextAreaElement>) - The keydown event
   */
  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      disableInput();
    }
  };

  /**
   * Adds the icon to the document in the database.
   * This calls the `documents.update` API from the Convex API.
   * @param icon (string) - The icon value
   */
  const onIconSelect = (icon: string) => {
    update({
      id: initialData._id,
      icon,
    });
  };

  /**
   * Removes the icon from the document in the database.
   * This calls the `documents.removeIcon` API from the Convex API.
   */
  const onRemoveIcon = () => {
    removeIcon({
      id: initialData._id,
    });
  };

  return (
    <div className="pl-[54px] group relative">
      {/* If editable document display icon picker */}
      {!!initialData.icon && !preview && (
        <div className="flex items-center gap-x-2 group/icon pt-6">
          <IconPicker onChange={onIconSelect}>
            <p className="text-6xl hover:opacity-75 transition">
              {initialData.icon}
            </p>
          </IconPicker>
          <Button
            onClick={onRemoveIcon}
            className="rounded-full opacity-0 group-hover/icon:opacity-100 transition text-muted-foreground text-xs"
            variant="outline"
            size="icon"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* If not editable document */}
      {!!initialData.icon && preview && (
        <p className="text-6xl pt-6">{initialData.icon}</p>
      )}
      {/* if has icon and editable document display icon picker */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-x-1 py-4">
        {!initialData.icon && !preview && (
          <IconPicker asChild onChange={onIconSelect}>
            <Button
              className="text-muted-foreground text-xs"
              variant="outline"
              size="sm"
            >
              <Smile className="h-4 w-4 mr-2" />
              Add icon
            </Button>
          </IconPicker>
        )}
        {/* if doesn't have cover image and editable document allow adding cover */}
        {!initialData.coverImage && !preview && (
          <Button
            onClick={coverImage.onOpen}
            className="text-muted-foreground text-xs"
            variant="outline"
            size="sm"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Add cover
          </Button>
        )}
      </div>
      {/* if document is being edited and not in preview use text area to modify tite */}
      {isEditing && !preview ? (
        <TextareaAutosize
          ref={inputRef}
          onBlur={disableInput}
          onKeyDown={onKeyDown}
          value={value}
          onChange={(e) => onInput(e.target.value)}
          className="text-5xl bg-transparent font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF] resize-none"
        />
      ) : (
        <div
          onClick={enableInput}
          className="pb-[11.5px] text-5xl font-bold break-words outline-none text-[#3F3F3F] dark:text-[#CFCFCF]"
        >
          {initialData.title}
        </div>
      )}
    </div>
  );
};

export default Toolbar;
