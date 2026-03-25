import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";

const COLORS = [
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#0891b2",
  "#059669",
  "#4f46e5",
  "#c026d3",
  "#0284c7",
];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function getRandomName() {
  const names = [
    "Anonymous Panda",
    "Curious Fox",
    "Clever Owl",
    "Brave Tiger",
    "Swift Hawk",
    "Wise Dolphin",
    "Gentle Bear",
    "Bold Eagle",
  ];
  return names[Math.floor(Math.random() * names.length)];
}

export interface CollaborationProvider {
  ydoc: Y.Doc;
  fragment: Y.XmlFragment;
  webrtcProvider: WebrtcProvider;
  indexeddbProvider: IndexeddbPersistence;
  user: { name: string; color: string };
}

export function createCollaborationProvider(
  docId: string
): CollaborationProvider {
  const ydoc = new Y.Doc();

  // Pre-create the XmlFragment so it's ready before the editor mounts
  const fragment = ydoc.getXmlFragment("default");

  const webrtcProvider = new WebrtcProvider(`smart-editor-${docId}`, ydoc, {
    signaling: ["wss://signaling.yjs.dev"],
  });

  const indexeddbProvider = new IndexeddbPersistence(
    `smart-editor-${docId}`,
    ydoc
  );

  const user = {
    name: getRandomName(),
    color: getRandomColor(),
  };

  return { ydoc, fragment, webrtcProvider, indexeddbProvider, user };
}
