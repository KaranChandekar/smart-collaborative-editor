# Smart Collaborative Editor

A Notion-style AI-powered collaborative document editor built with Next.js 15, Tiptap, and Yjs. Features real-time peer-to-peer collaboration, inline AI autocomplete, slash commands, and a conversational AI sidebar — all running in the browser with no backend database required.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)
![Tiptap](https://img.shields.io/badge/Tiptap-3-purple)
![Yjs](https://img.shields.io/badge/Yjs-CRDT-green)

## Features

### Block-Based Rich Text Editor
- Notion-style block editor powered by Tiptap 3 / ProseMirror
- Full formatting: bold, italic, underline, strikethrough, highlight, code
- Headings (H1–H3), bullet lists, numbered lists, task lists with checkboxes
- Code blocks with syntax highlighting (Lowlight)
- Blockquotes, horizontal dividers, images, links
- Text alignment (left, center, right)
- Drag-and-drop block handles

### AI-Powered Writing Assistance
- **Inline Autocomplete** — Ghost text suggestions appear as you type. Press `Tab` to accept.
- **Slash Commands** — Type `/` to open a command palette with AI actions (Write, Improve, Expand, Summarize) and block insertion commands.
- **Selection AI Toolbar** — Select text to get contextual AI actions: fix grammar, improve tone, shorten, expand, or improve clarity. Preview results before applying.
- **AI Chat Sidebar** — Ask questions about your document, get summaries, find grammar issues, or brainstorm ideas in a streaming chat interface.

All AI features are powered by Google Gemini 2.5 Flash via the Vercel AI SDK.

### Real-Time Collaboration
- **Peer-to-peer sync** via Yjs CRDTs and WebRTC — no central server needed
- **Live cursor presence** — see collaborators' cursors and selections in real-time with colored indicators
- **Offline persistence** — changes are saved to IndexedDB and sync automatically when reconnected
- **Instant sharing** — share the document URL; anyone with the link joins the same editing session

### Document Management
- Create, rename, and delete documents from the home dashboard
- Documents stored in browser localStorage (metadata) + IndexedDB (content via Yjs)
- Export to Markdown, HTML, or Plain Text

### Modern UI/UX
- Clean, colorful design with violet/fuchsia gradient theme
- Dark/light mode toggle
- Fully responsive — works on mobile, tablet, and desktop
- Smooth animations with Framer Motion
- Status bar with word count, character count, and connection status
- Custom scrollbar styling

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| UI | React 19, TypeScript 5 |
| Editor | Tiptap 3, ProseMirror, Lowlight |
| Collaboration | Yjs, y-webrtc, y-indexeddb, y-prosemirror |
| AI | Vercel AI SDK 6, Google Gemini 2.5 Flash |
| Styling | Tailwind CSS 4, Framer Motion |
| Components | shadcn/ui, Lucide Icons |
| Fonts | Geist Sans & Geist Mono |

## Architecture

```
src/
├── app/
│   ├── page.tsx                    # Home — document dashboard
│   ├── doc/[id]/page.tsx           # Document editor page
│   ├── globals.css                 # Theme & editor styles
│   └── api/ai/
│       ├── chat/route.ts           # Streaming document Q&A
│       ├── complete/route.ts       # Inline autocomplete
│       ├── improve/route.ts        # Grammar, tone, clarity, shorten
│       └── expand/route.ts         # Text expansion
├── components/
│   ├── editor/
│   │   ├── editor.tsx              # Main editor + layout
│   │   ├── toolbar.tsx             # Formatting toolbar
│   │   ├── slash-command.tsx        # "/" command palette
│   │   ├── ai-inline.tsx           # Ghost text autocomplete
│   │   ├── ai-toolbar.tsx          # Selection AI actions
│   │   └── block-handle.tsx        # Drag handle
│   ├── sidebar/
│   │   ├── ai-chat.tsx             # AI chat interface
│   │   └── outline.tsx             # Document outline / TOC
│   ├── collaboration/
│   │   └── cursor-presence.tsx     # Live collaborator avatars
│   └── ui/                         # shadcn/ui primitives
├── lib/
│   ├── ai.ts                       # Gemini model configuration
│   ├── collaboration.ts            # Yjs provider factory
│   ├── documents.ts                # localStorage CRUD
│   ├── editor-config.ts            # Tiptap extensions & config
│   └── export.ts                   # Markdown/HTML/Text export
└── types/
    └── index.ts                    # TypeScript interfaces
```

## How It Works

### Editor Initialization
1. User creates or opens a document from the dashboard
2. `DocumentEditor` initializes a Yjs `Y.Doc` with a pre-created `XmlFragment`
3. A WebRTC provider connects to `wss://signaling.yjs.dev` for P2P sync
4. An IndexedDB provider loads persisted content and enables offline support
5. Tiptap editor mounts with the Yjs fragment bound via `y-prosemirror` plugins
6. A random user identity (name + color) is assigned for collaboration cursors

### Collaboration Flow
- Each document has a unique room ID (`smart-editor-{docId}`)
- Yjs CRDTs handle conflict-free merging of concurrent edits
- WebRTC enables direct browser-to-browser sync (no server stores content)
- Cursor awareness broadcasts each user's selection state to all peers
- IndexedDB ensures no data loss on refresh or disconnect

### AI Pipeline
- **Autocomplete**: After 1.5s of inactivity (20+ chars context), the last 500 characters are sent to `/api/ai/complete`. Ghost text appears inline; press `Tab` to accept.
- **Slash Commands**: AI commands route through dedicated endpoints. The slash menu deletes the trigger text, calls the API, and inserts the result.
- **Selection Toolbar**: Selected text is sent to `/api/ai/improve` with a mode parameter (grammar/tone/clarity/shorten) or `/api/ai/expand`. Results are previewed before applying.
- **Chat Sidebar**: Full document text is sent as context with each message. Uses Vercel AI SDK streaming for real-time responses.

## Getting Started

### Prerequisites
- Node.js 18+
- A Google AI API key ([Get one here](https://aistudio.google.com/apikey))

### Installation

```bash
git clone https://github.com/KaranChandekar/smart-collaborative-editor.git
cd smart-collaborative-editor
npm install
```

### Environment Setup

Create a `.env.local` file in the project root:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start editing.

### Build

```bash
npm run build
npm start
```

## Usage

1. **Create a document** — Click "New Document" on the home page
2. **Start writing** — The editor supports all standard formatting shortcuts (`Cmd+B`, `Cmd+I`, etc.)
3. **Use AI** — Type `/` for the command palette, select text for AI actions, or open the AI chat sidebar
4. **Collaborate** — Share the URL with others; they'll join your editing session instantly via P2P
5. **Export** — Click the download icon to save as Markdown, HTML, or plain text

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/complete` | POST | Inline autocomplete (100 tokens max) |
| `/api/ai/improve` | POST | Grammar, tone, clarity, or shorten text |
| `/api/ai/expand` | POST | Expand text with more detail |
| `/api/ai/chat` | POST | Streaming document Q&A |

## License

MIT
