import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public API — uses service-level client (anon key) to fetch latest public notes
// This does NOT require authentication — it's designed for external widgets.
// Note: In production, you'd want to scope this to a specific user via query param or API key.

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
    .select("id, title, type, tags, ai_summary, ai_tags, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch brain items", details: error.message },
      { status: 500 }
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
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
