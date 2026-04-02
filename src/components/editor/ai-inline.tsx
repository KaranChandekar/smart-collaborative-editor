"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";

interface AIInlineProps {
  editor: Editor;
}

export function AIInline({ editor }: AIInlineProps) {
  const [suggestion, setSuggestion] = useState("");
  const isLoadingRef = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastText = useRef("");
  const decorationRef = useRef<HTMLSpanElement | null>(null);

  const fetchSuggestion = useCallback(
    async (context: string) => {
      if (context.length < 20 || isLoadingRef.current) return;

      isLoadingRef.current = true;
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
        // Silently fail for inline suggestions
      } finally {
        isLoadingRef.current = false;
      }
    },
    []
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
      } else if (
        suggestion &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey &&
        !event.metaKey &&
        event.key !== "Shift" &&
        event.key !== "Control" &&
        event.key !== "Alt" &&
        event.key !== "Meta"
      ) {
        // Dismiss suggestion on any printable/action key
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

  // Render ghost text inline at cursor position
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
      decorationRef.current = null;
    }

    const { from } = editor.state.selection;

    try {
      // Get the DOM position at the cursor
      const domPos = editor.view.domAtPos(from);
      const node = domPos.node;
      const offset = domPos.offset;

      const ghost = document.createElement("span");
      ghost.textContent = suggestion;
      ghost.className = "ai-ghost-suggestion";
      ghost.style.color = "var(--color-muted-foreground)";
      ghost.style.opacity = "0.45";
      ghost.style.fontStyle = "italic";
      ghost.style.pointerEvents = "none";
      ghost.style.userSelect = "none";
      ghost.style.whiteSpace = "pre-wrap";
      ghost.style.wordBreak = "break-word";
      ghost.setAttribute("data-ghost", "true");

      // Insert the ghost span inline after the cursor's DOM position
      if (node.nodeType === Node.TEXT_NODE) {
        // Cursor is inside a text node - insert after the text node
        const parent = node.parentNode;
        if (parent) {
          if (node.nextSibling) {
            parent.insertBefore(ghost, node.nextSibling);
          } else {
            parent.appendChild(ghost);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Cursor is at an element boundary
        const element = node as HTMLElement;
        if (offset < element.childNodes.length) {
          element.insertBefore(ghost, element.childNodes[offset]);
        } else {
          element.appendChild(ghost);
        }
      }

      decorationRef.current = ghost;
    } catch {
      // If DOM manipulation fails, clean up silently
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
    <div className="fixed bottom-12 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2 rounded-lg border bg-popover px-3 py-1.5 text-xs shadow-lg">
        <span className="text-muted-foreground">AI suggestion</span>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
          Tab
        </kbd>
        <span className="text-muted-foreground">to accept</span>
      </div>
    </div>
  );
}
