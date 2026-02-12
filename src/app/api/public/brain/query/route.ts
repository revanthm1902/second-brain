import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET — Fetch latest items (supports search)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
  const userId = searchParams.get("user_id");
  const search = searchParams.get("search");

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

  if (search && search.trim()) {
    query = query.or(
      `title.ilike.%${search}%,content.ilike.%${search}%,ai_summary.ilike.%${search}%`
    );
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
