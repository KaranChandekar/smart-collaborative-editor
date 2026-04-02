"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import {
  Sparkles,
  Wand2,
  Expand,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Minus,
  Image,
} from "lucide-react";

interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (editor: Editor) => void;
  category: string;
  iconColor: string;
}

interface SlashCommandMenuProps {
  editor: Editor;
  onAIAction: (action: string) => void;
}

const commands: SlashCommandItem[] = [
  {
    title: "AI Write",
    description: "Continue writing from cursor position",
    icon: Sparkles,
    category: "AI",
    iconColor: "text-violet-500 bg-violet-100 dark:bg-violet-950",
    action: () => {},
  },
  {
    title: "AI Improve",
    description: "Fix grammar and improve clarity of your text",
    icon: Wand2,
    category: "AI",
    iconColor: "text-fuchsia-500 bg-fuchsia-100 dark:bg-fuchsia-950",
    action: () => {},
  },
  {
    title: "AI Expand",
    description: "Add more detail and explanation",
    icon: Expand,
    category: "AI",
    iconColor: "text-cyan-500 bg-cyan-100 dark:bg-cyan-950",
    action: () => {},
  },
  {
    title: "AI Summarize",
    description: "Create a concise summary of the document",
    icon: FileText,
    category: "AI",
    iconColor: "text-amber-500 bg-amber-100 dark:bg-amber-950",
    action: () => {},
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    category: "Blocks",
    iconColor: "text-foreground bg-muted",
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    category: "Blocks",
    iconColor: "text-foreground bg-muted",
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    category: "Blocks",
    iconColor: "text-foreground bg-muted",
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet List",
    description: "Simple bullet list",
    icon: List,
    category: "Blocks",
    iconColor: "text-foreground bg-muted",
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "List with numbers",
    icon: ListOrdered,
    category: "Blocks",
    iconColor: "text-foreground bg-muted",
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "Task List",
    description: "Checkboxes for to-do items",
    icon: CheckSquare,
    category: "Blocks",
    iconColor: "text-emerald-500 bg-emerald-100 dark:bg-emerald-950",
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: "Code Block",
    description: "Code with syntax highlighting",
    icon: Code,
    category: "Blocks",
    iconColor: "text-foreground bg-muted",
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "Blockquote",
    description: "Capture a quote",
    icon: Quote,
    category: "Blocks",
    iconColor: "text-foreground bg-muted",
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Divider",
    description: "Horizontal line separator",
    icon: Minus,
    category: "Blocks",
    iconColor: "text-foreground bg-muted",
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: "Image",
    description: "Embed an image from URL",
    icon: Image,
    category: "Blocks",
    iconColor: "text-foreground bg-muted",
    action: (editor) => {
      const url = window.prompt("Enter image URL:");
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    },
  },
];

export function SlashCommandMenu({
  editor,
  onAIAction,
}: SlashCommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const slashPosRef = useRef<number>(0);

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  const executeCommand = useCallback(
    (command: SlashCommandItem) => {
      // Delete the "/" and query text using the stored slash position
      const { from } = editor.state.selection;
      const deleteFrom = slashPosRef.current;
      const deleteTo = from;

      if (deleteFrom < deleteTo) {
        editor.chain().focus().deleteRange({ from: deleteFrom, to: deleteTo }).run();
      }

      // After deletion, check if the block is now empty and join backward
      const resolvedPos = editor.state.doc.resolve(editor.state.selection.from);
      const isBlockEmpty = resolvedPos.parent.content.size === 0;

      if (command.category === "AI") {
        const actionMap: Record<string, string> = {
          "AI Write": "complete",
          "AI Improve": "improve",
          "AI Expand": "expand",
          "AI Summarize": "summarize",
        };

        // If the block is empty after deleting the slash, join with previous to avoid empty line
        if (isBlockEmpty && resolvedPos.depth > 0) {
          try {
            editor.commands.joinBackward();
          } catch {
            // joinBackward may fail if at start of doc, that's fine
          }
        }

        onAIAction(actionMap[command.title] || "complete");
      } else {
        // For block commands, if the block is empty, run the action directly (it will transform the empty block)
        command.action(editor);
      }

      setIsOpen(false);
      setQuery("");
    },
    [editor, onAIAction]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
      } else if (event.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, executeCommand]);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 50),
        from,
        "\n"
      );

      const slashMatch = textBefore.match(/\/([^\s/]*)$/);

      if (slashMatch) {
        setQuery(slashMatch[1]);
        setIsOpen(true);
        setSelectedIndex(0);

        // Store the absolute position of the "/" in the document
        slashPosRef.current = from - slashMatch[0].length;

        const coords = editor.view.coordsAtPos(from);
        const editorRect = editor.view.dom.getBoundingClientRect();
        setPosition({
          top: coords.bottom - editorRect.top + 8,
          left: coords.left - editorRect.left,
        });
      } else {
        setIsOpen(false);
        setQuery("");
      }
    };

    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor]);

  if (!isOpen || filteredCommands.length === 0) return null;

  const categories = [...new Set(filteredCommands.map((c) => c.category))];

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-72 sm:w-80 rounded-xl border border-border/60 bg-popover/95 backdrop-blur-xl p-1.5 shadow-2xl shadow-violet-500/10 animate-in fade-in-0 zoom-in-95"
      style={{ top: position.top, left: position.left }}
    >
      {categories.map((category) => (
        <div key={category}>
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {category}
          </div>
          {filteredCommands
            .filter((cmd) => cmd.category === category)
            .map((command) => {
              const globalIndex = filteredCommands.indexOf(command);
              return (
                <button
                  key={command.title}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all ${
                    globalIndex === selectedIndex
                      ? "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => executeCommand(command)}
                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${command.iconColor}`}
                  >
                    <command.icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{command.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {command.description}
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      ))}
    </div>
  );
}
