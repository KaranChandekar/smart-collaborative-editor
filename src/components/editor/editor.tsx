"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createEditorExtensions } from "@/lib/editor-config";
import { createCollaborationProvider } from "@/lib/collaboration";
import type { CollaborationProvider } from "@/lib/collaboration";
import { updateDocumentTitle } from "@/lib/documents";
import { Toolbar } from "./toolbar";
import { SlashCommandMenu } from "./slash-command";
import { AIInline } from "./ai-inline";
import { AIToolbar } from "./ai-toolbar";
import { BlockHandle } from "./block-handle";
import { AIChat } from "@/components/sidebar/ai-chat";
import { Outline } from "@/components/sidebar/outline";
import { CursorPresence } from "@/components/collaboration/cursor-presence";
import {
  exportToHTML,
  exportToMarkdown,
  exportToPlainText,
  downloadFile,
} from "@/lib/export";
import {
  MessageSquare,
  List,
  Download,
  FileText,
  Code,
  FileDown,
  Moon,
  Sun,
  Share2,
  Sparkles,
  Loader2,
  PanelRightClose,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EditorProps {
  docId: string;
  initialTitle?: string;
}

type SidebarView = "none" | "chat" | "outline";

export function DocumentEditor({ docId, initialTitle }: EditorProps) {
  const [collab, setCollab] = useState<CollaborationProvider | null>(null);
  const collabRef = useRef<CollaborationProvider | null>(null);

  useEffect(() => {
    const provider = createCollaborationProvider(docId);
    collabRef.current = provider;
    setCollab(provider);

    return () => {
      provider.webrtcProvider.destroy();
      provider.indexeddbProvider.destroy();
      provider.ydoc.destroy();
      collabRef.current = null;
    };
  }, [docId]);

  if (!collab) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-sm text-muted-foreground font-medium">
            Initializing editor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <EditorInner docId={docId} initialTitle={initialTitle} collab={collab} />
  );
}

function EditorInner({
  docId,
  initialTitle,
  collab,
}: {
  docId: string;
  initialTitle?: string;
  collab: CollaborationProvider;
}) {
  const [sidebarView, setSidebarView] = useState<SidebarView>("none");
  const [darkMode, setDarkMode] = useState(false);
  const [title, setTitle] = useState(initialTitle || "Untitled");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [aiActionLoading, setAiActionLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const editor = useEditor({
    extensions: createEditorExtensions(
      collab.fragment,
      collab.webrtcProvider,
      collab.user
    ),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[60vh] px-4 sm:px-8 py-6",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      updateDocumentTitle(docId, newTitle);
    },
    [docId]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  const copyShareUrl = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const cancelAIAction = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setAiActionLoading(false);
    toast.info("AI action cancelled");
  }, []);

  const handleAIAction = useCallback(
    async (action: string) => {
      if (!editor) return;

      const text = editor.getText();
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, "\n");

      // Abort any in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setAiActionLoading(true);

      try {
        if (action === "complete") {
          const res = await fetch("/api/ai/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ context: text.slice(-500) }),
            signal: controller.signal,
          });
          const data = await res.json();
          if (data.suggestion) {
            editor.chain().focus().insertContent(data.suggestion).run();
            toast.success("AI text generated");
          }
        } else if (action === "improve" || action === "summarize") {
          const mode = action === "summarize" ? "summarize" : "grammar";
          const res = await fetch("/api/ai/improve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: selectedText || text, mode }),
            signal: controller.signal,
          });
          const data = await res.json();
          if (data.improved) {
            if (selectedText) {
              editor
                .chain()
                .focus()
                .deleteRange({ from, to })
                .insertContentAt(from, data.improved)
                .run();
            } else {
              editor
                .chain()
                .focus()
                .insertContent("\n\n" + data.improved)
                .run();
            }
            toast.success(
              action === "summarize"
                ? "Summary generated"
                : "Text improved"
            );
          }
        } else if (action === "expand") {
          const res = await fetch("/api/ai/expand", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: selectedText || text }),
            signal: controller.signal,
          });
          const data = await res.json();
          if (data.expanded) {
            if (selectedText) {
              editor
                .chain()
                .focus()
                .deleteRange({ from, to })
                .insertContentAt(from, data.expanded)
                .run();
            } else {
              editor
                .chain()
                .focus()
                .insertContent("\n\n" + data.expanded)
                .run();
            }
            toast.success("Text expanded");
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          toast.error("AI request failed. Please try again.");
        }
      } finally {
        setAiActionLoading(false);
        abortControllerRef.current = null;
      }
    },
    [editor]
  );

  const wordCount = editor
    ? editor
        .getText()
        .split(/\s+/)
        .filter((w) => w.length > 0).length
    : 0;
  const charCount = editor ? editor.getText().length : 0;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/60 px-3 sm:px-5 py-2.5 bg-background/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity shrink-0"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md shadow-violet-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="hidden md:inline bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              Smart Editor
            </span>
          </Link>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <input
            value={title}
            onChange={handleTitleChange}
            className="bg-transparent text-base sm:text-lg font-semibold outline-none border-none focus:ring-0 min-w-0 flex-1 max-w-xs sm:max-w-sm truncate"
            placeholder="Untitled"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <CursorPresence
            provider={collab.webrtcProvider}
            currentUser={collab.user}
          />

          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyShareUrl}
              className="gap-1.5 text-xs h-8"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Share"}
            </Button>

            <Popover>
              <PopoverTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors">
                <Download className="h-3.5 w-3.5" />
              </PopoverTrigger>
              <PopoverContent className="w-44" align="end">
                <div className="space-y-0.5">
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => {
                      if (editor)
                        downloadFile(
                          exportToMarkdown(editor),
                          `${title}.md`,
                          "text/markdown"
                        );
                    }}
                  >
                    <FileDown className="h-4 w-4 text-violet-500" />
                    Markdown
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => {
                      if (editor)
                        downloadFile(
                          exportToHTML(editor),
                          `${title}.html`,
                          "text/html"
                        );
                    }}
                  >
                    <Code className="h-4 w-4 text-cyan-500" />
                    HTML
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => {
                      if (editor)
                        downloadFile(
                          exportToPlainText(editor),
                          `${title}.txt`,
                          "text/plain"
                        );
                    }}
                  >
                    <FileText className="h-4 w-4 text-emerald-500" />
                    Plain Text
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="h-5 w-px bg-border hidden sm:block" />

          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 transition-colors ${sidebarView === "outline" ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" : ""}`}
            onClick={() =>
              setSidebarView((v) => (v === "outline" ? "none" : "outline"))
            }
            title="Outline"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 transition-colors ${sidebarView === "chat" ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" : ""}`}
            onClick={() =>
              setSidebarView((v) => (v === "chat" ? "none" : "chat"))
            }
            title="AI Chat"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar editor={editor} />

      {/* AI Loading Bar */}
      {aiActionLoading && (
        <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-950/50 border-b border-violet-200 dark:border-violet-800">
          <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
          <span className="text-sm text-violet-700 dark:text-violet-300">
            AI is working...
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800"
            onClick={cancelAIAction}
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-background">
          <div className="editor-wrapper group relative mx-auto max-w-3xl">
            {editor && <BlockHandle editor={editor} />}
            {editor && (
              <SlashCommandMenu editor={editor} onAIAction={handleAIAction} />
            )}
            {editor && <AIToolbar editor={editor} />}
            {editor && <AIInline editor={editor} />}
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Sidebar */}
        {sidebarView !== "none" && (
          <div className="w-full sm:w-80 absolute sm:relative right-0 top-0 h-full sm:h-auto z-30 sm:z-auto border-l border-border/60 bg-background/95 backdrop-blur-xl sm:bg-background overflow-hidden shadow-xl sm:shadow-none">
            <div className="sm:hidden flex justify-end p-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSidebarView("none")}
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            </div>
            {sidebarView === "chat" && <AIChat editor={editor} />}
            {sidebarView === "outline" && <Outline editor={editor} />}
          </div>
        )}
      </div>

      {/* Status bar */}
      <footer className="flex items-center justify-between border-t border-border/60 px-4 py-1.5 text-xs text-muted-foreground bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 sm:gap-4">
          <span>{wordCount} words</span>
          <span className="hidden sm:inline">{charCount} characters</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden sm:inline text-muted-foreground/60">
            Yjs P2P
          </span>
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Connected
          </span>
        </div>
      </footer>
    </div>
  );
}
