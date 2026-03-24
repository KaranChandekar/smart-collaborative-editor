---
name: smart-collaborative-editor
description: "Build an AI-enhanced collaborative document editor with block-based editing, inline AI suggestions, and real-time collaboration via Yjs. Use this skill whenever the user wants to work on the collaborative editor project, mentions block editor, Notion-like editor, Tiptap, Lexical, rich text editor, AI autocomplete, slash commands, real-time collaboration, Yjs, CRDT, or wants to build/extend/debug any part of this application. Also trigger when the user mentions inline suggestions, document Q&A, or collaborative editing in the context of this project."
---

# Smart Collaborative Document Editor

## What You're Building

A Notion-style block-based editor with embedded AI capabilities: inline autocomplete, grammar/tone suggestions, content expansion, slash commands for AI actions, and an AI sidebar for document Q&A. Supports real-time collaboration via Yjs (CRDT-based sync).

This is one of the hardest frontend projects you can build — rich text editing requires deep DOM knowledge, state management, and meticulous UX. That's exactly why it's impressive.

## Architecture Overview

```
app/
├── layout.tsx
├── page.tsx                      # Document list
├── doc/[id]/page.tsx            # Editor view
├── api/
│   ├── ai/
│   │   ├── complete/route.ts    # Inline autocomplete
│   │   ├── improve/route.ts     # Grammar/tone/clarity
│   │   ├── expand/route.ts      # Expand selection
│   │   └── chat/route.ts        # Document Q&A
│   └── collaboration/
│       └── route.ts             # Yjs WebSocket signaling
├── components/
│   ├── editor/
│   │   ├── editor.tsx           # Main Tiptap editor wrapper
│   │   ├── toolbar.tsx          # Formatting toolbar
│   │   ├── slash-command.tsx    # Slash command menu
│   │   ├── ai-inline.tsx       # Ghost text autocomplete
│   │   ├── ai-toolbar.tsx      # Selection-based AI actions
│   │   └── block-handle.tsx    # Drag handle for blocks
│   ├── sidebar/
│   │   ├── ai-chat.tsx         # Document Q&A chat
│   │   ├── outline.tsx         # Document outline / TOC
│   │   └── version-history.tsx  # Edit history
│   └── collaboration/
│       ├── cursor-presence.tsx  # Show other users' cursors
│       └── user-avatar.tsx
├── lib/
│   ├── editor-config.ts        # Tiptap extensions and config
│   ├── ai.ts                   # AI SDK setup
│   ├── collaboration.ts        # Yjs provider setup
│   └── export.ts               # Export to markdown/HTML/PDF
└── types/
    └── index.ts
```

## Tech Stack & Setup

```bash
npx create-next-app@latest smart-editor --typescript --tailwind --eslint --app
cd smart-editor

# Rich text editor (Tiptap = ProseMirror-based)
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm
npm install @tiptap/extension-placeholder @tiptap/extension-highlight
npm install @tiptap/extension-task-list @tiptap/extension-task-item
npm install @tiptap/extension-code-block-lowlight @tiptap/extension-image
npm install @tiptap/extension-link @tiptap/extension-typography
npm install @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor

# AI
npm install ai @ai-sdk/google zod

# Real-time collaboration
npm install yjs y-webrtc y-indexeddb       # Peer-to-peer sync (no server needed!)

# Syntax highlighting for code blocks
npm install lowlight

# UI
npm install framer-motion lucide-react
npx shadcn@latest init
npx shadcn@latest add button card popover command dialog tooltip separator
```

### Environment Variables

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
```

## Core Implementation Strategy

### 1. Tiptap Editor Setup

Tiptap is built on ProseMirror and gives you a block-based editor with extensions.

```typescript
// lib/editor-config.ts
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

export function createEditorConfig(ydoc, provider, user) {
  return {
    extensions: [
      StarterKit.configure({ history: false }), // Disable built-in history (Yjs handles it)
      Placeholder.configure({ placeholder: "Type '/' for commands..." }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({
        provider,
        user: { name: user.name, color: user.color },
      }),
      // Custom AI extension (see below)
    ],
  };
}
```

### 2. Slash Command Menu

Notion-style `/` commands that trigger AI actions.

```typescript
// components/editor/slash-command.tsx
const commands = [
  { title: "AI Write", description: "Let AI continue writing", icon: Sparkles,
    action: (editor) => triggerAIComplete(editor) },
  { title: "AI Improve", description: "Improve grammar and clarity", icon: Wand,
    action: (editor) => triggerAIImprove(editor) },
  { title: "AI Expand", description: "Expand on the selected text", icon: Expand,
    action: (editor) => triggerAIExpand(editor) },
  { title: "AI Summarize", description: "Summarize the document", icon: FileText,
    action: (editor) => triggerAISummarize(editor) },
  { title: "Heading 1", description: "Large section heading", icon: Heading1,
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run() },
  { title: "Bullet List", description: "Simple bullet list", icon: List,
    action: (editor) => editor.chain().focus().toggleBulletList().run() },
  { title: "Code Block", description: "Code with syntax highlighting", icon: Code,
    action: (editor) => editor.chain().focus().toggleCodeBlock().run() },
  { title: "Task List", description: "Checkboxes for to-do items", icon: CheckSquare,
    action: (editor) => editor.chain().focus().toggleTaskList().run() },
];
```

### 3. AI Inline Autocomplete (Ghost Text)

Show AI-suggested text in gray that the user can accept with Tab.

```typescript
// AI autocomplete endpoint
// app/api/ai/complete/route.ts
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: Request) {
  const { context, cursor } = await req.json();
  // context = text before cursor, cursor = current position

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    prompt: `Continue this text naturally. Write 1-2 sentences max.
Do not repeat what's already written. Just continue from where it left off.

Text so far:
${context}

Continue:`,
    maxTokens: 100,
  });

  return Response.json({ suggestion: text });
}
```

### 4. Real-Time Collaboration with Yjs

Yjs uses CRDTs (Conflict-free Replicated Data Types) to sync edits between users without a central server. y-webrtc connects users peer-to-peer.

```typescript
// lib/collaboration.ts
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";

export function createCollaborationProvider(docId: string) {
  const ydoc = new Y.Doc();

  // Peer-to-peer sync (no server needed!)
  const webrtcProvider = new WebrtcProvider(`smart-editor-${docId}`, ydoc, {
    signaling: ["wss://signaling.yjs.dev"], // Free public signaling server
  });

  // Offline persistence
  const indexeddbProvider = new IndexeddbPersistence(docId, ydoc);

  return { ydoc, webrtcProvider, indexeddbProvider };
}
```

### 5. AI Sidebar Chat (Document Q&A)

Chat with your document — ask questions about the content, get suggestions, brainstorm.

```typescript
// app/api/ai/chat/route.ts
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: Request) {
  const { messages, documentContent } = await req.json();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: `You are an AI writing assistant. The user is working on this document:

---
${documentContent}
---

Help them with questions about the document, suggest improvements,
brainstorm ideas, or help with any writing task. Be concise and helpful.`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

## Implementation Phases

### Phase 1: Core Editor (Week 1)
- Tiptap editor with basic formatting (headings, lists, code, tasks)
- Formatting toolbar
- Slash command menu for block types
- Placeholder text
- Save to localStorage (IndexedDB via Yjs)

### Phase 2: AI Features (Week 2)
- Slash commands for AI actions (write, improve, expand, summarize)
- Inline ghost text autocomplete (accept with Tab)
- Selection-based AI toolbar (improve, shorten, expand, translate)
- AI sidebar chat for document Q&A
- Streaming responses for all AI features

### Phase 3: Collaboration & Polish (Week 3)
- Yjs real-time collaboration (peer-to-peer)
- Multi-user cursor presence
- Document outline sidebar
- Export to Markdown, HTML, PDF
- Dark mode and responsive design
- Keyboard shortcuts reference

## Free Resources

| Resource | Purpose | Free Tier |
|----------|---------|-----------|
| Google Gemini API | AI features | ~1M tokens/day |
| Tiptap | Rich text editor | Open source (MIT) |
| Yjs | Real-time sync | Open source |
| y-webrtc | P2P collaboration | Open source + free signaling |
| IndexedDB | Offline persistence | Built into browsers |
| Vercel | Hosting | 100GB bandwidth |

## Resume Talking Points

- **Rich text editing**: One of the hardest frontend problems. Shows deep ProseMirror/DOM understanding.
- **CRDTs + Yjs**: Real-time collaboration without a central server. Explain conflict resolution.
- **Natural AI integration**: AI that enhances the writing experience (not a bolted-on chatbot).
- **Extension architecture**: Tiptap's plugin system shows understanding of composable software design.
