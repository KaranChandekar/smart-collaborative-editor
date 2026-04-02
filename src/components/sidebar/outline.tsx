"use client";

import { useState, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { List, FileText } from "lucide-react";

interface HeadingItem {
  level: number;
  text: string;
  pos: number;
}

interface OutlineProps {
  editor: Editor | null;
}

export function Outline({ editor }: OutlineProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  useEffect(() => {
    if (!editor) return;

    const updateHeadings = () => {
      const items: HeadingItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          items.push({
            level: node.attrs.level,
            text: node.textContent,
            pos,
          });
        }
      });
      setHeadings(items);
    };

    updateHeadings();
    editor.on("update", updateHeadings);
    return () => {
      editor.off("update", updateHeadings);
    };
  }, [editor]);

  const scrollToHeading = (pos: number) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection(pos).run();
    const domNode = editor.view.domAtPos(pos).node;
    if (domNode instanceof HTMLElement) {
      domNode.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const levelColors = [
    "",
    "text-violet-600 dark:text-violet-400 font-semibold",
    "text-fuchsia-600 dark:text-fuchsia-400 font-medium",
    "text-cyan-600 dark:text-cyan-400",
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60">
        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
          <List className="h-3.5 w-3.5 text-white" />
        </div>
        <h3 className="font-semibold text-sm">Document Outline</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {headings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-muted mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Start adding headings (H1, H2, H3) to build your document outline.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Type <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">/</kbd> to see available blocks
            </p>
          </div>
        ) : (
          <nav className="space-y-0.5">
            {headings.map((heading, index) => (
              <button
                key={index}
                className={`w-full text-left text-sm px-3 py-1.5 rounded-lg hover:bg-accent transition-colors truncate ${
                  levelColors[heading.level] || ""
                }`}
                style={{
                  paddingLeft: `${(heading.level - 1) * 14 + 12}px`,
                }}
                onClick={() => scrollToHeading(heading.pos)}
              >
                {heading.text || "Untitled"}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
