import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { Extension } from "@tiptap/core";
import { ySyncPlugin, yUndoPlugin, undo, redo } from "y-prosemirror";
import { common, createLowlight } from "lowlight";
import type * as Y from "yjs";
import type { WebrtcProvider } from "y-webrtc";
import type { CollaborationUser } from "@/types";

const lowlight = createLowlight(common);

/**
 * Custom Collaboration extension using y-prosemirror directly,
 * bypassing @tiptap/extension-collaboration's initialization order bug
 * that causes "ystate is undefined" in v3.
 */
const CustomCollaboration = Extension.create<{ fragment: Y.XmlFragment }>({
  name: "collaboration",
  priority: 1000,

  addOptions() {
    return {
      fragment: null as unknown as Y.XmlFragment,
    };
  },

  addCommands() {
    return {
      undo:
        () =>
        ({ state }) => {
          return undo(state);
        },
      redo:
        () =>
        ({ state }) => {
          return redo(state);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-z": () => this.editor.commands.undo(),
      "Mod-y": () => this.editor.commands.redo(),
      "Shift-Mod-z": () => this.editor.commands.redo(),
    };
  },

  addProseMirrorPlugins() {
    const fragment = this.options.fragment;
    return [ySyncPlugin(fragment), yUndoPlugin()];
  },
});

export function createEditorExtensions(
  fragment: Y.XmlFragment,
  provider: WebrtcProvider,
  user: CollaborationUser
) {
  return [
    StarterKit.configure({
      undoRedo: false,
      codeBlock: false,
    }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === "heading") {
          return "Heading";
        }
        return "Type '/' for commands, or start writing...";
      },
    }),
    Highlight.configure({ multicolor: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
    CodeBlockLowlight.configure({ lowlight }),
    Image,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class:
          "text-violet-600 dark:text-violet-400 underline cursor-pointer hover:text-violet-700 dark:hover:text-violet-300 transition-colors",
      },
    }),
    Typography,
    Underline,
    TextStyle,
    Color,
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    CustomCollaboration.configure({
      fragment,
    }),
    CollaborationCursor.configure({
      provider,
      user: {
        name: user.name,
        color: user.color,
      },
    }),
  ];
}
