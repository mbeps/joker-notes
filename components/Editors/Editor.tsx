"use client";

import { useTheme } from "next-themes";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView, useBlockNote } from "@blocknote/react";
import "@blocknote/core/style.css";
import { useEdgeStore } from "@/lib/edgestore";

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

/**
 * Editor component that uses BlockNote to render a rich text editor.
 * BlockNote allows for the creation of rich text notes with images, links, and more.
 */
const Editor: React.FC<EditorProps> = ({
  onChange,
  editable,
  initialContent,
}) => {
  // get the current theme from Next.js
  const { resolvedTheme } = useTheme();
  // get the EdgeStore hooks to manage the file storage
  const { edgestore } = useEdgeStore();

  /**
   * Handle file upload such as images so that they can be used as notes.
   * This uploads the file to EdgeStore and returns the URL.
   */
  const handleUpload = async (file: File) => {
    /**
     * Upload the file to EdgeStore.
     * This returns the URL of the uploaded file.
     * This URL can be used to display the file and be stored in the database.
     */
    const response = await edgestore.publicFiles.upload({
      file,
    });

    return response.url;
  };

  /**
   * Initialize the editor with the initial content.
   */
  const editor: BlockNoteEditor = useBlockNote({
    editable,
    initialContent: initialContent
      ? (JSON.parse(initialContent) as PartialBlock[])
      : undefined,
    onEditorContentChange: (editor) => {
      onChange(JSON.stringify(editor.topLevelBlocks, null, 2));
    },
    uploadFile: handleUpload,
  });

  return (
    <div>
      <BlockNoteView
        editor={editor}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
    </div>
  );
};
export default Editor;
