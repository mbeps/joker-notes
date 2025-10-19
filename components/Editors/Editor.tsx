"use client";

import { useTheme } from "next-themes";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useEdgeStore } from "@/lib/edgestore";

/**
 * Props accepted by the rich text editor including change handler and initial content.
 */
interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

/**
 * BlockNote powered editor configured for Joker Notes documents.
 * Handles initial content hydration and file uploads through Edge Store.
 *
 * @param onChange Callback invoked with the serialized BlockNote document JSON.
 * @param editable When false, renders the editor read-only.
 * @param initialContent Serialized BlockNote document used to hydrate the editor.
 * @returns Rich text editor wired to Joker Notes storage.
 * @see https://blocknotejs.org
 * @see https://docs.edgestore.dev
 */
const Editor: React.FC<EditorProps> = ({
  onChange,
  editable,
  initialContent,
}) => {
  // Get the current theme from Next.js
  const { resolvedTheme } = useTheme();
  // Get the EdgeStore hooks to manage the file storage
  const { edgestore } = useEdgeStore();

  /**
   * Uploads embedded files to Edge Store and returns the hosted URL.
   *
   * @param file The local file selected by BlockNote.
   * @returns The public URL returned by Edge Store.
   * @see https://docs.edgestore.dev
   */
  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({
      file,
    });

    return response.url;
  };

  /**
   * Initialize the editor with the initial content.
   */
  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialContent
      ? (JSON.parse(initialContent) as PartialBlock[])
      : undefined,
    uploadFile: handleUpload,
  });

  return (
    <div>
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={() => {
          // Calls onChange with the updated content
          onChange(JSON.stringify(editor.document, null, 2));
        }}
        theme={resolvedTheme === "dark" ? "dark" : "light"}
      />
    </div>
  );
};

export default Editor;
