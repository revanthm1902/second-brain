export interface BrainItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  ai_summary: string | null;
  ai_tags: string[];
  ai_category: string | null;
  created_at: string;
  updated_at: string;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  embedding?: number[] | null;
}

export interface UserProfile {
  id: string;
  email: string;
}

export type ItemType = "note" | "link" | "insight" | "article" | string;

export const ITEM_TYPES: { value: string; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "article", label: "Article" },
  { value: "insight", label: "Insight" },
  { value: "link", label: "Link" },
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
