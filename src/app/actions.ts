"use server";

import { createServerSupabase } from "@/app/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { BrainItem, ItemType } from "@/app/lib/types";
import { generateAIMetadata } from "@/app/lib/ai-service";

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

  const { data, error } = await supabase
    .from("brain_items")
    .insert(insertData)
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

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { success: false, error: "File must be under 10MB" };
  }

  let content: string;
  const fileName = file.name;
  const fileType = file.type;

  try {
    if (fileType === "application/pdf") {
      // PDF: dynamic import to avoid build-time evaluation issues with Turbopack
      const { PDFParse } = await import("pdf-parse");
      const arrayBuf = await file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuf);
      const parser = new PDFParse({ data: uint8 });
      const result = await parser.getText();
      content = result.text.trim();
      if (!content) {
        content = `[PDF: ${fileName}] (No text could be extracted. It might be an image-only PDF.)`;
      }
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
  } catch (err) {
    console.error("File processing error:", err);
    content = `[File Upload Error] Could not process ${fileName}.`;
  }

  // Truncate very large files but keep enough context for AI (approx 30k chars)
  if (content.length > 30000) {
    content = content.slice(0, 30000) + "\n\n[... truncated file content]";
  }

  const title = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
  const type: ItemType = fileType === "application/pdf" || fileType.startsWith("text/") ? "note" : "link";

  // Generate AI metadata with better summary focus
  const aiMeta = await generateAIMetadata(title, content);

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

  const { data, error } = await supabase
    .from("brain_items")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error uploading file:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true, item: data as BrainItem };
}
