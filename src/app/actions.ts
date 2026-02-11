"use server";

import { createServerSupabase } from "@/app/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { BrainItem, ItemType } from "@/app/lib/types";
import {
  generateAIMetadata,
  queryBrainAI,
  AIConfigError,
  AIQuotaError,
} from "@/app/lib/ai-service";

// ─── Conversational AI Query ─────────────────────────────────
export async function queryBrain(
  question: string
): Promise<{ answer: string; sources: BrainItem[] }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { answer: "Please sign in to query your brain.", sources: [] };

  // Fetch all user items for context
  const { data: items } = await supabase
    .from("brain_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!items || items.length === 0) {
    return {
      answer: "Your brain is empty! Start by capturing some notes, links, or insights.",
      sources: [],
    };
  }

  try {
    const { answer, sourceIndices } = await queryBrainAI(question, items as BrainItem[]);

    const sources = sourceIndices.map((i) => items[i] as BrainItem);

    return {
      answer,
      sources: sources.length > 0 ? sources : (items.slice(0, 2) as BrainItem[]),
    };
  } catch (err: unknown) {
    if (err instanceof AIConfigError) {
      return { answer: err.message, sources: [] };
    }
    if (err instanceof AIQuotaError) {
      return {
        answer: "⚠️ AI quota exceeded — the free Gemini API tier has limited requests per minute. Please wait about a minute and try again.",
        sources: [],
      };
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Brain query failed:", errorMsg);
    return {
      answer: "I had trouble processing that. The AI service may be temporarily unavailable. Please try again in a moment.",
      sources: [],
    };
  }
}

// ─── Fetch Items ─────────────────────────────────────────────
export async function fetchBrainItems(
  search?: string,
  typeFilter?: string,
  tagFilter?: string
): Promise<BrainItem[]> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from("brain_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (search && search.trim()) {
    query = query.or(
      `title.ilike.%${search}%,content.ilike.%${search}%,ai_summary.ilike.%${search}%`
    );
  }

  if (typeFilter && typeFilter !== "all") {
    query = query.eq("type", typeFilter);
  }

  if (tagFilter) {
    query = query.or(`ai_tags.cs.{${tagFilter}},tags.cs.{${tagFilter}}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching brain items:", error);
    return [];
  }

  return (data ?? []) as BrainItem[];
}

// ─── Create Item ─────────────────────────────────────────────
export async function createBrainItem(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  item?: BrainItem;
}> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const type = (formData.get("type") as ItemType) || "note";

  if (!title || !content) {
    return { success: false, error: "Title and content are required" };
  }

  // Generate AI metadata — tags are FULLY automatic
  const aiMeta = await generateAIMetadata(title, content);

  const { data, error } = await supabase
    .from("brain_items")
    .insert({
      user_id: user.id,
      title,
      content,
      type,
      tags: aiMeta.tags,
      ai_summary: aiMeta.summary,
      ai_tags: aiMeta.tags,
      ai_category: aiMeta.category,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating brain item:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true, item: data as BrainItem };
}

// ─── Delete Item ─────────────────────────────────────────────
export async function deleteBrainItem(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("brain_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting brain item:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

// ─── Sign Out ────────────────────────────────────────────────
export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  revalidatePath("/");
}
