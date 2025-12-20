"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Link as LinkIcon,
  List,
  ListOrdered,
} from "lucide-react";

interface RichTextInputProps {
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

export default function RichTextInput({
  value = "",
  onChange,
  placeholder = "Enter text here...",
}: RichTextInputProps) {
  const [linkInput, setLinkInput] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
        heading: false,
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // Sync external value changes with editor
  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkInput) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkInput })
        .run();
      setLinkInput("");
    }
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  return (
    <div className="border rounded-md">
      <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-50">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive("bold") ? "bg-gray-300" : ""
          }`}
          title="Bold (Ctrl+B disabled)"
        >
          <Bold size={18} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive("italic") ? "bg-gray-300" : ""
          }`}
          title="Italic (Ctrl+I disabled)"
        >
          <Italic size={18} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive("underline") ? "bg-gray-300" : ""
          }`}
          title="Underline (Ctrl+U disabled)"
        >
          <UnderlineIcon size={18} />
        </button>

        <div className="w-px bg-gray-300"></div>

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive("bulletList") ? "bg-gray-300" : ""
          }`}
          title="Bullet List (Ctrl+Shift+8)"
        >
          <List size={18} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive("orderedList") ? "bg-gray-300" : ""
          }`}
          title="Ordered List (Ctrl+Shift+7)"
        >
          <ListOrdered size={18} />
        </button>

        <div className="w-px bg-gray-300"></div>

        <div className="flex gap-1 items-center">
          <input
            type="text"
            placeholder="URL"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                addLink();
              }
            }}
            className="px-2 py-1 border rounded text-sm"
          />
          <button
            onClick={addLink}
            className="p-2 rounded hover:bg-gray-200"
            title="Add Link"
          >
            <LinkIcon size={18} />
          </button>
          {editor.isActive("link") && (
            <button
              onClick={removeLink}
              className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded text-red-700"
            >
              Remove Link
            </button>
          )}
        </div>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none"
      />
    </div>
  );
}
