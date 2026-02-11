import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { queryBrainAI, AIConfigError, AIQuotaError } from "@/app/lib/ai-service";
import type { BrainItem } from "@/app/lib/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET — Fetch latest items
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
  const userId = searchParams.get("user_id");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let query = supabase
    .from("brain_items")
    .select("id, title, type, tags, ai_summary, ai_tags, ai_category, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch brain items", details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }

  return NextResponse.json(
    {
      count: data?.length || 0,
      items: data || [],
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}

// POST — Conversational query against a user's brain
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, user_id } = body;

    if (!question || !user_id) {
      return NextResponse.json(
        { error: "Both 'question' and 'user_id' are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: items, error } = await supabase
      .from("brain_items")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !items || items.length === 0) {
      return NextResponse.json(
        {
          answer: "No items found in this brain.",
          sources: [],
        },
        { status: 200, headers: corsHeaders }
      );
    }

    try {
      const { answer, sourceIndices } = await queryBrainAI(question, items as BrainItem[]);

      const sources = sourceIndices
        .filter((i) => i >= 0 && i < items.length)
        .map((i) => ({
          id: items[i].id,
          title: items[i].title,
          type: items[i].type,
          ai_summary: items[i].ai_summary,
        }));

      return NextResponse.json(
        { answer, sources, timestamp: new Date().toISOString() },
        { status: 200, headers: corsHeaders }
      );
    } catch (err) {
      if (err instanceof AIConfigError) {
        return NextResponse.json(
          { error: err.message },
          { status: 500, headers: corsHeaders }
        );
      }
      if (err instanceof AIQuotaError) {
        return NextResponse.json(
          { answer: "AI quota exceeded. Please wait a minute and try again.", sources: [] },
          { status: 200, headers: corsHeaders }
        );
      }
      throw err;
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500, headers: corsHeaders }
    );
  }
}
