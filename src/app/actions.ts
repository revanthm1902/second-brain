"use server";

import { createServerSupabase } from "@/app/lib/supabase-server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import type { BrainItem, ItemType } from "@/app/lib/types";

// ─── AI Helper ───────────────────────────────────────────────
async function generateAIMetadata(
  title: string,
  content: string
): Promise<{ summary: string; tags: string[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key") {
    return {
      summary: `${title} — ${content.slice(0, 80)}`,
      tags: ["untagged"],
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analyze the following content and respond ONLY with valid JSON (no markdown, no code fences).

Title: ${title}
Content: ${content}

Return JSON in this exact format:
{"summary": "A concise 1-sentence summary", "tags": ["tag1", "tag2", "tag3"]}

Rules:
- Summary must be exactly 1 sentence, under 20 words.
- Provide 2-3 lowercase tags relevant to the content.
- Return ONLY the JSON object, nothing else.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip potential markdown code fences
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      summary: parsed.summary || title,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 3) : ["untagged"],
    };
  } catch (error) {
    console.error("AI generation failed:", error);
    return {
      summary: `${title} — ${content.slice(0, 80)}`,
      tags: ["untagged"],
    };
  }
}

// ─── Fetch Items ─────────────────────────────────────────────
export async function fetchBrainItems(
  search?: string,
  typeFilter?: string
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
  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (!title || !content) {
    return { success: false, error: "Title and content are required" };
  }

  // Generate AI metadata
  const aiMeta = await generateAIMetadata(title, content);

  const { data, error } = await supabase
    .from("brain_items")
    .insert({
      user_id: user.id,
      title,
      content,
      type,
      tags,
      ai_summary: aiMeta.summary,
      ai_tags: aiMeta.tags,
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
