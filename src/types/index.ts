export interface Document {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollaborationUser {
  name: string;
  color: string;
}

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (editor: unknown) => void;
  category: "ai" | "blocks";
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}
