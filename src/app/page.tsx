"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getDocuments,
  createDocument,
  deleteDocument,
} from "@/lib/documents";
import type { Document } from "@/types";
import {
  FileText,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Moon,
  Sun,
  Zap,
  Users,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setDocuments(getDocuments());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleCreate = () => {
    const doc = createDocument();
    router.push(`/doc/${doc.id}`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDocument(id);
    setDocuments(getDocuments());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const features = [
    {
      icon: Brain,
      title: "AI-Powered",
      description: "Inline autocomplete, slash commands, and document Q&A",
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-100 dark:bg-violet-950",
      textColor: "text-violet-600 dark:text-violet-400",
    },
    {
      icon: Users,
      title: "Real-time Collab",
      description: "Peer-to-peer sync with live cursors via Yjs",
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-100 dark:bg-cyan-950",
      textColor: "text-cyan-600 dark:text-cyan-400",
    },
    {
      icon: Zap,
      title: "Block Editor",
      description: "Notion-style blocks with rich formatting support",
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-100 dark:bg-amber-950",
      textColor: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/50 via-white to-cyan-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                Smart Editor
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                AI-powered collaborative writing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={handleCreate}
              className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25 border-0 text-sm sm:text-base"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Document</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center">
            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10 sm:mb-14"
            >
              <div className="flex items-center justify-center h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-2xl shadow-violet-500/30 mb-6 sm:mb-8 mx-auto">
                <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-gray-900 via-violet-900 to-fuchsia-900 dark:from-white dark:via-violet-200 dark:to-fuchsia-200 bg-clip-text text-transparent">
                Write smarter, together
              </h2>
              <p className="text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
                A Notion-style editor with AI autocomplete, slash commands,
                and real-time peer-to-peer collaboration.
              </p>
              <Button
                onClick={handleCreate}
                size="lg"
                className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-xl shadow-violet-500/25 border-0 h-12 px-8 text-base rounded-xl"
              >
                <Plus className="h-5 w-5" />
                Create your first document
              </Button>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 w-full max-w-3xl"
            >
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5 sm:p-6 text-left hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all"
                >
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-xl ${feature.bgColor} mb-3`}
                  >
                    <feature.icon
                      className={`h-5 w-5 ${feature.textColor}`}
                    />
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold">Your Documents</h2>
              <span className="text-xs text-muted-foreground">
                {documents.length} document{documents.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {documents.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="group cursor-pointer"
                    onClick={() => router.push(`/doc/${doc.id}`)}
                  >
                    <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 sm:p-5 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-950 dark:to-fuchsia-950 shrink-0">
                            <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <h3 className="font-semibold truncate text-sm sm:text-base">
                            {doc.title}
                          </h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 shrink-0"
                          onClick={(e) => handleDelete(doc.id, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(doc.updatedAt)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
