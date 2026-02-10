export interface BrainItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: "note" | "link" | "insight";
  tags: string[];
  ai_summary: string | null;
  ai_tags: string[];
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
