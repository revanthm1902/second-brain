"use server";

import { createServerSupabase } from "@/app/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { BrainItem, ItemType } from "@/app/lib/types";
import { generateAIMetadata, generateEmbedding } from "@/app/lib/ai-service";

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

  // Generate embedding for vector search
  const embedding = await generateEmbedding(`${title} ${content}`);

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    title,
    content,
    type,
    tags: aiMeta.tags,
    ai_summary: aiMeta.summary,
    ai_tags: aiMeta.tags,
    ai_category: aiMeta.category,
  };
  if (embedding) {
    insertData.embedding = JSON.stringify(embedding);
  }

  let { data, error } = await supabase
    .from("brain_items")
    .insert(insertData)
    .select()
    .single();

  // Retry without embedding if the column doesn't exist yet
  if (error && error.message.includes("column")) {
    delete insertData.embedding;
    ({ data, error } = await supabase
      .from("brain_items")
      .insert(insertData)
      .select()
      .single());
  }

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

// ─── Vector Search ───────────────────────────────────────────
export async function vectorSearch(
  query: string
): Promise<BrainItem[]> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const embedding = await generateEmbedding(query);
  if (!embedding) {
    // Fallback to text search if embedding fails
    return fetchBrainItems(query);
  }

  const { data, error } = await supabase.rpc("match_brain_items", {
    query_embedding: JSON.stringify(embedding),
    match_threshold: 0.5,
    match_count: 20,
    p_user_id: user.id,
  });

  if (error) {
    console.error("Vector search failed, falling back to text search:", error);
    return fetchBrainItems(query);
  }

  return (data ?? []) as BrainItem[];
}

// ─── Update Item ─────────────────────────────────────────────
export async function updateBrainItem(
  id: string,
  updates: { title?: string; content?: string; type?: ItemType }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("brain_items")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating brain item:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

// ─── File Upload (extract text + create item) ────────────────
export async function uploadFile(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  item?: BrainItem;
}> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };

  const file = formData.get("file") as File;
  if (!file) return { success: false, error: "No file provided" };

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { success: false, error: "File must be under 5MB" };
  }

  let content: string;
  const fileName = file.name;
  const fileType = file.type;

  try {
    if (fileType === "application/pdf") {
      // PDF: read raw text (basic extraction)
      const buffer = await file.arrayBuffer();
      const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
      // Extract readable text from PDF (basic approach)
      const cleanText = text
        .replace(/[^\x20-\x7E\n\r\t]/g, " ")
        .replace(/\s{3,}/g, "\n")
        .trim();
      content = cleanText.slice(0, 10000) || `Uploaded file: ${fileName}`;
    } else if (
      fileType.startsWith("text/") ||
      fileType === "application/json" ||
      fileType === "application/xml" ||
      fileName.endsWith(".md") ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".csv")
    ) {
      content = await file.text();
    } else {
      content = `Uploaded file: ${fileName} (${fileType}, ${(file.size / 1024).toFixed(1)}KB)`;
    }
  } catch {
    content = `Uploaded file: ${fileName}`;
  }

  // Truncate very large files
  if (content.length > 10000) {
    content = content.slice(0, 10000) + "\n\n[... truncated]";
  }

  const title = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  const type: ItemType = fileType === "application/pdf" || fileType.startsWith("text/") ? "note" : "link";

  const aiMeta = await generateAIMetadata(title, content);
  const embedding = await generateEmbedding(`${title} ${content}`);

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    title,
    content,
    type,
    tags: [...aiMeta.tags, "uploaded"],
    ai_summary: aiMeta.summary,
    ai_tags: [...aiMeta.tags, "uploaded"],
    ai_category: aiMeta.category,
  };
  if (embedding) {
    insertData.embedding = JSON.stringify(embedding);
  }

  let { data, error } = await supabase
    .from("brain_items")
    .insert(insertData)
    .select()
    .single();

  // Retry without embedding if the column doesn't exist yet
  if (error && error.message.includes("column")) {
    delete insertData.embedding;
    ({ data, error } = await supabase
      .from("brain_items")
      .insert(insertData)
      .select()
      .single());
  }

  if (error) {
    console.error("Error uploading file:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true, item: data as BrainItem };
}

// ─── Fetch Related Items (for graph) ─────────────────────────
export async function fetchRelatedItems(): Promise<{
  items: BrainItem[];
  edges: { source: string; target: string; label: string }[];
}> {
  const items = await fetchBrainItems();
  if (items.length === 0) return { items: [], edges: [] };

  const edges: { source: string; target: string; label: string }[] = [];

  // Build edges based on shared tags
  for (let i = 0; i < items.length; i++) {
    const tagsI = new Set([...items[i].tags, ...items[i].ai_tags]);
    for (let j = i + 1; j < items.length; j++) {
      const tagsJ = new Set([...items[j].tags, ...items[j].ai_tags]);
      const shared = [...tagsI].filter((t) => tagsJ.has(t));
      if (shared.length > 0) {
        edges.push({
          source: items[i].id,
          target: items[j].id,
          label: shared.slice(0, 2).join(", "),
        });
      }
    }
  }

  // Also connect items with same category
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (
        items[i].ai_category &&
        items[i].ai_category === items[j].ai_category &&
        !edges.some(
          (e) =>
            (e.source === items[i].id && e.target === items[j].id) ||
            (e.source === items[j].id && e.target === items[i].id)
        )
      ) {
        edges.push({
          source: items[i].id,
          target: items[j].id,
          label: items[i].ai_category!,
        });
      }
    }
  }

  return { items, edges };
}
