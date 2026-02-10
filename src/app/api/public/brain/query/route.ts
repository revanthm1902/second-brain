import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI not configured" },
        { status: 500, headers: corsHeaders }
      );
    }

    const context = items
      .map(
        (item, i) =>
          `[${i + 1}] "${item.title}" (${item.type}): ${item.ai_summary || item.content?.slice(0, 200)}`
      )
      .join("\n");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a helpful assistant for a personal knowledge base. Answer based ONLY on the notes provided.

KNOWLEDGE BASE:
${context}

QUESTION: "${question}"

Be concise (2-4 sentences). Reference notes by their index [1], [2], etc.`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim();

    // Extract source indices
    const indexMatches = answer.match(/\[(\d+)\]/g);
    const indices = indexMatches
      ? [...new Set(indexMatches.map((m) => parseInt(m.replace(/[\[\]]/g, "")) - 1))]
      : [];

    const sources = indices
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
  } catch {
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500, headers: corsHeaders }
    );
  }
}
