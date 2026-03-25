"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Link,
  Image,
  CodeSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ToolbarProps {
  editor: Editor | null;
}

interface ToolbarButton {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action: () => void;
  isActive?: () => boolean;
  shortcut?: string;
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  const groups: ToolbarButton[][] = [
    [
      {
        icon: Undo,
        label: "Undo",
        action: () => editor.chain().focus().undo().run(),
        shortcut: "⌘Z",
      },
      {
        icon: Redo,
        label: "Redo",
        action: () => editor.chain().focus().redo().run(),
        shortcut: "⌘⇧Z",
      },
    ],
    [
      {
        icon: Bold,
        label: "Bold",
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: () => editor.isActive("bold"),
        shortcut: "⌘B",
      },
      {
        icon: Italic,
        label: "Italic",
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: () => editor.isActive("italic"),
        shortcut: "⌘I",
      },
      {
        icon: Underline,
        label: "Underline",
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: () => editor.isActive("underline"),
        shortcut: "⌘U",
      },
      {
        icon: Strikethrough,
        label: "Strikethrough",
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: () => editor.isActive("strike"),
      },
      {
        icon: Code,
        label: "Inline Code",
        action: () => editor.chain().focus().toggleCode().run(),
        isActive: () => editor.isActive("code"),
        shortcut: "⌘E",
      },
      {
        icon: Highlighter,
        label: "Highlight",
        action: () => editor.chain().focus().toggleHighlight().run(),
        isActive: () => editor.isActive("highlight"),
      },
    ],
    [
      {
        icon: Heading1,
        label: "Heading 1",
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: () => editor.isActive("heading", { level: 1 }),
      },
      {
        icon: Heading2,
        label: "Heading 2",
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: () => editor.isActive("heading", { level: 2 }),
      },
      {
        icon: Heading3,
        label: "Heading 3",
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: () => editor.isActive("heading", { level: 3 }),
      },
    ],
    [
      {
        icon: List,
        label: "Bullet List",
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: () => editor.isActive("bulletList"),
      },
      {
        icon: ListOrdered,
        label: "Ordered List",
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: () => editor.isActive("orderedList"),
      },
      {
        icon: CheckSquare,
        label: "Task List",
        action: () => editor.chain().focus().toggleTaskList().run(),
        isActive: () => editor.isActive("taskList"),
      },
    ],
    [
      {
        icon: Quote,
        label: "Blockquote",
        action: () => editor.chain().focus().toggleBlockquote().run(),
        isActive: () => editor.isActive("blockquote"),
      },
      {
        icon: CodeSquare,
        label: "Code Block",
        action: () => editor.chain().focus().toggleCodeBlock().run(),
        isActive: () => editor.isActive("codeBlock"),
      },
      {
        icon: Minus,
        label: "Divider",
        action: () => editor.chain().focus().setHorizontalRule().run(),
      },
    ],
    [
      {
        icon: AlignLeft,
        label: "Align Left",
        action: () => editor.chain().focus().setTextAlign("left").run(),
        isActive: () => editor.isActive({ textAlign: "left" }),
      },
      {
        icon: AlignCenter,
        label: "Align Center",
        action: () => editor.chain().focus().setTextAlign("center").run(),
        isActive: () => editor.isActive({ textAlign: "center" }),
      },
      {
        icon: AlignRight,
        label: "Align Right",
        action: () => editor.chain().focus().setTextAlign("right").run(),
        isActive: () => editor.isActive({ textAlign: "right" }),
      },
    ],
    [
      {
        icon: Link,
        label: "Link",
        action: () => {
          const url = window.prompt("Enter URL:");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        },
        isActive: () => editor.isActive("link"),
      },
      {
        icon: Image,
        label: "Image",
        action: () => {
          const url = window.prompt("Enter image URL:");
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        },
      },
    ],
  ];

  return (
    <div className="flex items-center gap-0.5 flex-wrap border-b border-border/60 bg-background/80 backdrop-blur-xl px-2 sm:px-3 py-1.5 sticky top-[53px] z-10 overflow-x-auto">
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex items-center gap-0.5">
          {groupIndex > 0 && (
            <Separator orientation="vertical" className="mx-0.5 sm:mx-1 h-5" />
          )}
          {group.map((button) => (
            <Button
              key={button.label}
              variant="ghost"
              size="sm"
              className={`h-7 w-7 sm:h-8 sm:w-8 p-0 transition-all ${
                button.isActive?.()
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={button.action}
              title={
                button.shortcut
                  ? `${button.label} (${button.shortcut})`
                  : button.label
              }
            >
              <button.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
}
