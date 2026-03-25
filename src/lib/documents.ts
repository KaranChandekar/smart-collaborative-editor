"use client";

import type { Document } from "@/types";

const STORAGE_KEY = "smart-editor-documents";

export function getDocuments(): Document[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveDocuments(docs: Document[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function createDocument(title?: string): Document {
  const doc: Document = {
    id: crypto.randomUUID(),
    title: title || "Untitled",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const docs = getDocuments();
  docs.unshift(doc);
  saveDocuments(docs);
  return doc;
}

export function deleteDocument(id: string) {
  const docs = getDocuments().filter((d) => d.id !== id);
  saveDocuments(docs);
}

export function updateDocumentTitle(id: string, title: string) {
  const docs = getDocuments();
  const doc = docs.find((d) => d.id === id);
  if (doc) {
    doc.title = title;
    doc.updatedAt = new Date().toISOString();
    saveDocuments(docs);
  }
}
