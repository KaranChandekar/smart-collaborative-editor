"use client";

import { useState, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
  Sparkles,
  Wand2,
  Shrink,
  Expand,
  Languages,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIToolbarProps {
  editor: Editor;
}

export function AIToolbar({ editor }: AIToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, " ");

      if (text.length > 3) {
        setSelectedText(text);
        setIsVisible(true);
        setResult("");

        const coordsStart = editor.view.coordsAtPos(from);
        const coordsEnd = editor.view.coordsAtPos(to);
        const editorWrapper = editor.view.dom.closest(".editor-wrapper");
        const editorRect = editorWrapper?.getBoundingClientRect();
        if (editorRect) {
          const toolbarHeight = 48;
          // Position above selection by default
          let top = coordsStart.top - editorRect.top - toolbarHeight;

          // If toolbar would be hidden behind the sticky header (~100px from viewport top),
          // position it below the selection instead
          if (coordsStart.top - toolbarHeight < 100) {
            top = coordsEnd.bottom - editorRect.top + 8;
          }

          setPosition({
            top,
            left: Math.max(0, coordsStart.left - editorRect.left),
          });
        }
      } else {
        setIsVisible(false);
        setResult("");
      }
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor]);

  const handleAIAction = useCallback(
    async (mode: string) => {
      if (!selectedText) return;

      setIsLoading(true);
      try {
        let endpoint = "/api/ai/improve";
        let body: Record<string, string> = { text: selectedText, mode };

        if (mode === "expand") {
          endpoint = "/api/ai/expand";
          body = { text: selectedText };
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        setResult(data.improved || data.expanded || "");
      } catch {
        setResult("Failed to get AI response");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedText]
  );

  const applyResult = useCallback(() => {
    if (!result || !editor) return;

    const { from, to } = editor.state.selection;
    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContentAt(from, result)
      .run();
    setResult("");
    setIsVisible(false);
  }, [result, editor]);

  const dismissResult = useCallback(() => {
    setResult("");
    setIsVisible(false);
  }, []);

  if (!isVisible) return null;

  const actions = [
    { icon: Wand2, label: "Fix grammar", mode: "grammar" },
    { icon: Sparkles, label: "Improve tone", mode: "tone" },
    { icon: Shrink, label: "Shorten", mode: "shorten" },
    { icon: Expand, label: "Expand", mode: "expand" },
    { icon: Languages, label: "Clarity", mode: "clarity" },
  ];

  return (
    <div
      className="absolute z-50 animate-in fade-in-0 zoom-in-95"
      style={{ top: position.top, left: position.left }}
    >
      {result ? (
        <div className="rounded-lg border bg-popover p-3 shadow-lg max-w-md">
          <p className="text-sm mb-2 max-h-32 overflow-y-auto">{result}</p>
          <div className="flex gap-1">
            <Button size="sm" variant="default" onClick={applyResult}>
              <Check className="h-3 w-3 mr-1" />
              Apply
            </Button>
            <Button size="sm" variant="ghost" onClick={dismissResult}>
              <X className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-lg">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                AI is thinking...
              </span>
            </div>
          ) : (
            actions.map((action) => (
              <Button
                key={action.mode}
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs gap-1"
                onClick={() => handleAIAction(action.mode)}
              >
                <action.icon className="h-3.5 w-3.5" />
                {action.label}
              </Button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
