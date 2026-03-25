"use client";

import { useState, useEffect, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { GripVertical } from "lucide-react";

interface BlockHandleProps {
  editor: Editor;
}

export function BlockHandle({ editor }: BlockHandleProps) {
  const [position, setPosition] = useState<{ top: number } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{
    pos: number;
    node: HTMLElement;
  } | null>(null);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!editor?.view) return;

      const editorDom = editor.view.dom;
      const editorRect = editorDom.getBoundingClientRect();

      // Check if mouse is within editor bounds
      if (
        event.clientX < editorRect.left - 40 ||
        event.clientX > editorRect.right + 40 ||
        event.clientY < editorRect.top ||
        event.clientY > editorRect.bottom
      ) {
        setPosition(null);
        setHoveredNode(null);
        return;
      }

      // Find the block node at cursor position
      const pos = editor.view.posAtCoords({
        left: editorRect.left + 10,
        top: event.clientY,
      });

      if (!pos) {
        setPosition(null);
        setHoveredNode(null);
        return;
      }

      const $pos = editor.state.doc.resolve(pos.pos);
      const node = $pos.node(1);

      if (node) {
        const domNode = editor.view.nodeDOM($pos.before(1));
        if (domNode instanceof HTMLElement) {
          const nodeRect = domNode.getBoundingClientRect();
          setPosition({
            top: nodeRect.top - editorRect.top + 2,
          });
          setHoveredNode({ pos: $pos.before(1), node: domNode });
        }
      }
    },
    [editor]
  );

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  if (!position || !hoveredNode) return null;

  return (
    <div
      className="absolute -left-8 z-10 cursor-grab opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-50"
      style={{ top: position.top }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(
          "text/plain",
          hoveredNode.pos.toString()
        );
        hoveredNode.node.classList.add("opacity-50");
      }}
      onDragEnd={() => {
        hoveredNode.node.classList.remove("opacity-50");
      }}
    >
      <div className="flex items-center justify-center h-6 w-6 rounded hover:bg-muted">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
