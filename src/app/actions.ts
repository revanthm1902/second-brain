"use server";

import { createServerSupabase } from "@/app/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import type { BrainItem, ItemType } from "@/app/lib/types";
import { DEFAULT_TAG_CATEGORIES } from "@/app/lib/types";

// ─── AI Helper — Improved summarization + auto-tagging ───────
async function generateAIMetadata(
  title: string,
  content: string
): Promise<{ summary: string; tags: string[]; category: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key") {
    return {
      summary: `${title} — ${content.slice(0, 80)}`,
      tags: ["untagged"],
      category: "Learning",
    };
  }

  const allCategories = DEFAULT_TAG_CATEGORIES.map((c) => c.name);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const truncatedContent = content.length > 2000 ? content.slice(0, 2000) + '...' : content;

    const prompt = `You are a knowledge curator. Read the content below and produce metadata.

Title: ${title}
Content: ${truncatedContent}

Rules:
1. SUMMARY: Write 2-3 sentences that explain the CORE IDEA — what this is about, what the takeaway is, and why it matters. DO NOT copy the title or repeat the first lines verbatim. Synthesize and distill the meaning in your own words.
2. TAGS: 3-5 lowercase hyphenated tags about the specific topics (e.g. "knowledge-management", "ai-tools", "note-taking"). No generic words like "idea" or "content".
3. CATEGORY: Pick ONE from: ${allCategories.join(", ")}

Return ONLY this JSON, nothing else:
{"summary": "...", "tags": ["..."], "category": "..."}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      summary: parsed.summary || title,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : ["untagged"],
      category: allCategories.includes(parsed.category) ? parsed.category : "Learning",
    };
  } catch (error) {
    console.error("AI generation failed:", error);
    return {
      summary: `${title} — ${content.slice(0, 80)}`,
      tags: ["untagged"],
      category: "Learning",
    };
  }
}

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key") {
    return { answer: "AI is not configured. Add your Gemini API key.", sources: [] };
  }

  // Build context from brain items — keep it concise to avoid token limits
  const brainContext = items
    .slice(0, 30)
    .map(
      (item: BrainItem, i: number) =>
        `[${i + 1}] "${item.title}" (${item.type}): ${(item.ai_summary || item.content || "").slice(0, 150)}`
    )
    .join("\n");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a helpful assistant for a personal knowledge base. Answer based on the notes below.

NOTES:
${brainContext}

QUESTION: ${question}

Rules: Be concise (2-4 sentences). Cite notes by index like [1]. If no relevant notes exist, say so.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    if (!responseText) {
      return { answer: "I couldn't generate an answer. Please try rephrasing your question.", sources: [] };
    }
    const answer = responseText.trim();

    // Extract referenced indices from the answer
    const indexMatches = answer.match(/\[(\d+)\]/g);
    const referencedIndices = indexMatches
      ? [...new Set(indexMatches.map((m) => parseInt(m.replace(/[\[\]]/g, "")) - 1))]
      : [];

    const sources = referencedIndices
      .filter((i) => i >= 0 && i < items.length)
      .map((i) => items[i] as BrainItem);

    return { answer, sources: sources.length > 0 ? sources : (items.slice(0, 2) as BrainItem[]) };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Brain query failed:", errorMsg);
    return { answer: `I had trouble processing that. Error: ${errorMsg.slice(0, 100)}`, sources: [] };
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
