"use client";

import { useMutation } from "convex/react";
import { ImageIcon, Smile, X } from "lucide-react";
import type React from "react";
import { type ElementRef, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useCoverImage } from "@/hooks/useCoverImage";
import IconPicker from "../Icon/IconPicker";
import { Button } from "../ui/button";

/**
 * Props supplied to the document toolbar including the Convex document payload.
 * The optional preview flag lets consumers disable edits for read-only views.
 */
interface ToolbarProps {
  initialData: Doc<"documents">;
  preview?: boolean;
}

/**
 * Document header controller that manages title editing, emoji icons, and cover images.
 * Persists updates through Convex mutations while coordinating UI affordances.
 *
 * @param initialData The source document to display and mutate.
 * @param preview When true, disables editing affordances for read-only previews.
 * @returns Toolbar region that coordinates icon, title, and cover interactions.
 * @see https://docs.convex.dev/database/writing-data
 */
const Toolbar: React.FC<ToolbarProps> = ({ initialData, preview }) => {
  const inputRef = useRef<ElementRef<"textarea">>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialData.title);

  /**
   * Convex mutation used to persist title and icon changes.
   */
  const update = useMutation(api.documents.update);
  /**
   * Convex mutation that removes the icon metadata from a document.
   */
  const removeIcon = useMutation(api.documents.removeIcon);

  /**
   * Zustand-backed modal controls for managing document cover images.
   *
   * @see https://docs.pmnd.rs/zustand
   */
  const coverImage = useCoverImage();

  /**
   * Enables title editing and repopulates the input with the latest value.
   * Focus is deferred to ensure React has mounted the textarea.
   *
   * @returns void
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
   * Restores read-only mode for the title field.
   *
   * @returns void
   */
  const disableInput = () => setIsEditing(false);

  /**
   * Persists the latest title value, falling back to `Untitled` when empty.
   */
  const onInput = (value: string) => {
    setValue(value);
    update({
      id: initialData._id,
      title: value || "Untitled",
    });
  };

  /**
   * Prevents multiline entry by intercepting the Enter key and closing the editor.
   */
  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      disableInput();
    }
  };

  /**
   * Saves the selected emoji as the document icon via the Convex update mutation.
   */
  const onIconSelect = (icon: string) => {
    update({
      id: initialData._id,
      icon,
    });
  };

  /**
   * Clears the current emoji icon by calling the dedicated Convex mutation.
   */
  const onRemoveIcon = () => {
    removeIcon({
      id: initialData._id,
    });
  };

  return (
    <div className="group relative pl-[54px]">
      {/* If editable document display icon picker */}
      {!!initialData.icon && !preview && (
        <div className="group/icon flex items-center gap-x-2 pt-6">
          <IconPicker onChange={onIconSelect}>
            <p className="text-6xl transition hover:opacity-75">
              {initialData.icon}
            </p>
          </IconPicker>
          <Button
            onClick={onRemoveIcon}
            className="rounded-full text-muted-foreground text-xs opacity-0 transition group-hover/icon:opacity-100"
            variant="outline"
            size="icon"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* If not editable document */}
      {!!initialData.icon && preview && (
        <p className="pt-6 text-6xl">{initialData.icon}</p>
      )}
      {/* if has icon and editable document display icon picker */}
      <div className="flex items-center gap-x-1 py-4 opacity-0 group-hover:opacity-100">
        {!initialData.icon && !preview && (
          <IconPicker asChild onChange={onIconSelect}>
            <Button
              className="text-muted-foreground text-xs"
              variant="outline"
              size="sm"
            >
              <Smile className="mr-2 h-4 w-4" />
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
            <ImageIcon className="mr-2 h-4 w-4" />
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
          className="resize-none break-words bg-transparent font-bold text-5xl text-[#3F3F3F] outline-hidden dark:text-[#CFCFCF]"
        />
      ) : (
        <div
          onClick={enableInput}
          className="break-words pb-[11.5px] font-bold text-5xl text-[#3F3F3F] outline-hidden dark:text-[#CFCFCF]"
        >
          {initialData.title}
        </div>
      )}
    </div>
  );
};

export default Toolbar;
