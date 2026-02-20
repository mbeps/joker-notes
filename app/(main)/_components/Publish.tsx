"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverPositioner,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useOrigin } from "@/hooks/useOrigin";
import { useMutation } from "convex/react";
import { Globe, Check, Copy } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

/**
 * Props passed to the publish popover, including the Convex document payload.
 */
interface PublishProps {
  initialData: Doc<"documents">;
}

/**
 * Popover UI that toggles a document's published state and exposes the public URL.
 * Uses the origin hook to build shareable links and Convex mutations to persist state.
 * @see https://docs.convex.dev/database/writing-data
 * @see https://nextjs.org/docs/app/api-reference/functions/use-router.
 */
const Publish: React.FC<PublishProps> = ({ initialData }) => {
  const origin = useOrigin();
  const update = useMutation(api.documents.update);

  // keeps track of whether the URL has been copied to the clipboard
  const [copied, setCopied] = useState(false);
  // keeps track of whether the user is submitting the form
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * The full URL of the the published note.
   * Published notes do not have the same URL as the editor.
   * If the note is not published, navigating to this URL will return a 404.
   */
  const url = `${origin}/preview/${initialData._id}`;

  /**
   * Publishes the note so it becomes visible on the public preview route.
   */
  const onPublish = () => {
    setIsSubmitting(true);

    /**
     * Updates the document with the `isPublished` property set to `true`.
     * This makes the note visible to the public.
     */
    const promise = update({
      id: initialData._id, // the ID of the document
      isPublished: true, // whether the document is published
    }).finally(() => setIsSubmitting(false));

    toast.promise(promise, {
      loading: "Publishing...",
      success: "Note published",
      error: "Failed to publish note.",
    });
  };

  /**
   * Reverts the document to a private state by disabling the public flag.
   */
  const onUnpublish = () => {
    setIsSubmitting(true);

    /**
     * Updates the document with the `isPublished` property set to `false`.
     * This makes the note invisible to the public.
     */
    const promise = update({
      id: initialData._id, // the ID of the document
      isPublished: false, // whether the document is published
    }).finally(() => setIsSubmitting(false));

    toast.promise(promise, {
      loading: "Unpublishing...",
      success: "Note unpublished",
      error: "Failed to unpublish note.",
    });
  };

  /**
   * Copies the public URL to the clipboard and briefly shows confirmation.
   */
  const onCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  return (
    <Popover>
      <PopoverTrigger render={<Button size="sm" variant="ghost" />}>
        Publish
        {initialData.isPublished && (
          <Globe className="text-sky-500 w-4 h-4 ml-2" />
        )}
      </PopoverTrigger>
      <PopoverPositioner align="end" alignOffset={8}>
        <PopoverContent className="w-72">
        {initialData.isPublished ? (
          <div className="space-y-4">
            <div className="flex items-center gap-x-2">
              <Globe className="text-sky-500 animate-pulse h-4 w-4" />
              <p className="text-xs font-medium text-sky-500">
                This note is live on web.
              </p>
            </div>
            <div className="flex items-center">
              <input
                className="flex-1 px-2 text-xs border rounded-l-md h-8 bg-muted truncate"
                value={url}
                disabled
              />
              <Button
                onClick={onCopy}
                disabled={copied}
                className="h-8 rounded-l-none"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              size="sm"
              className="w-full text-xs"
              disabled={isSubmitting}
              onClick={onUnpublish}
            >
              Unpublish
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Globe className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium mb-2">Publish this note</p>
            <span className="text-xs text-muted-foreground mb-4">
              Share your work with others.
            </span>
            <Button
              disabled={isSubmitting}
              onClick={onPublish}
              className="w-full text-xs"
              size="sm"
            >
              Publish
            </Button>
          </div>
        )}
        </PopoverContent>
      </PopoverPositioner>
    </Popover>
  );
};

export default Publish;
