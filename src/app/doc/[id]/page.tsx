"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DocumentEditor } from "@/components/editor/editor";
import { getDocuments } from "@/lib/documents";

export default function DocPage() {
  const params = useParams();
  const docId = params.id as string;
  const [title, setTitle] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const docs = getDocuments();
    const doc = docs.find((d) => d.id === docId);
    setTitle(doc?.title || "Untitled");
  }, [docId]);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  return <DocumentEditor docId={docId} initialTitle={title} />;
}
