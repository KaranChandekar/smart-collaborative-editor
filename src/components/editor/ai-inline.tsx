"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";

interface AIInlineProps {
  editor: Editor;
}

export function AIInline({ editor }: AIInlineProps) {
  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastText = useRef("");
  const decorationRef = useRef<HTMLSpanElement | null>(null);

  const fetchSuggestion = useCallback(
    async (context: string) => {
      if (context.length < 20 || isLoading) return;

      setIsLoading(true);
      try {
        const res = await fetch("/api/ai/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context: context.slice(-500) }),
        });
        const data = await res.json();
        if (data.suggestion) {
          setSuggestion(data.suggestion);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const acceptSuggestion = useCallback(() => {
    if (!suggestion || !editor) return;

    editor.chain().focus().insertContent(suggestion).run();
    setSuggestion("");
  }, [suggestion, editor]);

  // Listen for Tab key to accept suggestion
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab" && suggestion) {
        event.preventDefault();
        acceptSuggestion();
      } else if (suggestion && event.key !== "Shift" && event.key !== "Control" && event.key !== "Alt" && event.key !== "Meta") {
        // Dismiss suggestion on any other key
        setSuggestion("");
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [suggestion, acceptSuggestion]);

  // Watch for text changes and trigger AI completion
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const text = editor.getText();
      if (text === lastText.current) return;
      lastText.current = text;

      setSuggestion("");

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Only suggest at end of document or paragraph
      const { from } = editor.state.selection;
      const $pos = editor.state.doc.resolve(from);
      const isAtEnd = from === editor.state.doc.content.size - 1;
      const isEndOfBlock = $pos.parentOffset === $pos.parent.content.size;

      if ((isAtEnd || isEndOfBlock) && text.length > 20) {
        debounceTimer.current = setTimeout(() => {
          const textBefore = editor.state.doc.textBetween(
            Math.max(0, from - 500),
            from,
            "\n"
          );
          fetchSuggestion(textBefore);
        }, 1500);
      }
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [editor, fetchSuggestion]);

  // Render ghost text after cursor
  useEffect(() => {
    if (!editor || !suggestion) {
      if (decorationRef.current) {
        decorationRef.current.remove();
        decorationRef.current = null;
      }
      return;
    }

    // Remove old decoration
    if (decorationRef.current) {
      decorationRef.current.remove();
    }

    const { from } = editor.state.selection;
    const coords = editor.view.coordsAtPos(from);
    const editorDom = editor.view.dom;
    const editorRect = editorDom.getBoundingClientRect();

    const ghost = document.createElement("span");
    ghost.textContent = suggestion;
    ghost.className = "pointer-events-none text-muted-foreground/50 italic";
    ghost.style.position = "absolute";
    ghost.style.top = `${coords.top - editorRect.top}px`;
    ghost.style.left = `${coords.left - editorRect.left}px`;
    ghost.style.fontSize = "inherit";
    ghost.style.lineHeight = "inherit";
    ghost.style.whiteSpace = "pre";

    const parent = editorDom.parentElement;
    if (parent) {
      parent.style.position = "relative";
      parent.appendChild(ghost);
      decorationRef.current = ghost;
    }

    return () => {
      if (decorationRef.current) {
        decorationRef.current.remove();
        decorationRef.current = null;
      }
    };
  }, [editor, suggestion]);

  if (!suggestion) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2 rounded-lg border bg-popover px-3 py-2 text-sm shadow-lg">
        <span className="text-muted-foreground">AI suggestion ready</span>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-mono">
          Tab
        </kbd>
        <span className="text-muted-foreground">to accept</span>
      </div>
    </div>
  );
}
