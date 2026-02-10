export interface BrainItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: "note" | "link" | "insight";
  tags: string[];
  ai_summary: string | null;
  ai_tags: string[];
  ai_category: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
}

export type ItemType = "note" | "link" | "insight";

export const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "link", label: "Link" },
  { value: "insight", label: "Insight" },
];

// ─── Tag Categories ─────────────────────────────────
export const DEFAULT_TAG_CATEGORIES: TagCategory[] = [
  { name: "Technology", color: "#3b82f6", tags: ["ai", "web", "api", "code", "devops", "database", "frontend", "backend", "mobile", "cloud"] },
  { name: "Business", color: "#22c55e", tags: ["strategy", "marketing", "finance", "startup", "product", "growth", "analytics"] },
  { name: "Personal", color: "#a855f7", tags: ["health", "fitness", "mindset", "habit", "journal", "reflection", "goal"] },
  { name: "Creative", color: "#ec4899", tags: ["design", "writing", "art", "music", "photography", "video", "branding"] },
  { name: "Learning", color: "#f97316", tags: ["tutorial", "course", "book", "research", "concept", "framework", "theory"] },
  { name: "Work", color: "#06b6d4", tags: ["project", "meeting", "task", "deadline", "collaboration", "process", "tool"] },
];

export interface TagCategory {
  name: string;
  color: string;
  tags: string[];
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  sources?: BrainItem[];
}
