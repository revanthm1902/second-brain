"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Loader2,
  Brain,
  FileText,
  Link2,
  Lightbulb,
  Sparkles,
  BookOpen,
} from "lucide-react";

interface WidgetItem {
  id: string;
  title: string;
  type: string;
  ai_summary: string | null;
  tags: string[];
  ai_tags: string[];
}

export default function WidgetPage() {
  const [userId, setUserId] = useState("");
  const [configured, setConfigured] = useState(false);
  const [items, setItems] = useState<WidgetItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchItems = useCallback(async (uid: string, query?: string) => {
    setSearchLoading(true);
    try {
      const url = new URL("/api/public/brain/query", window.location.origin);
      url.searchParams.set("user_id", uid);
      url.searchParams.set("limit", "30");
      if (query) url.searchParams.set("search", query);
      const res = await fetch(url.toString());
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      // ignore
    }
    setSearchLoading(false);
  }, []);

  // Initialize from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("user_id");
    if (uid) {
      setUserId(uid);
      setConfigured(true);
      fetchItems(uid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchItems(userId, searchQuery.trim() || undefined);
  }

  function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!userId.trim()) return;
    setConfigured(true);
    fetchItems(userId.trim());
  }

  const typeIcons: Record<string, typeof FileText> = {
    note: FileText,
    link: Link2,
    insight: Lightbulb,
    article: BookOpen,
  };

  if (!configured) {
    return (
      <div
        className="min-h-screen bg-[#f0e6d3] flex items-center justify-center p-4"
        style={{
          backgroundImage: "url('/bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="bg-white border-[2.5px] border-[#1a1a1a] rounded-2xl shadow-[6px_6px_0_#1a1a1a] p-8 max-w-sm w-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#ff6b35] border-[2.5px] border-[#1a1a1a] rounded-xl shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg">Second Brain</h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Widget Setup
              </p>
            </div>
          </div>
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label htmlFor="widget-user-id" className="text-xs font-black uppercase tracking-wider text-gray-600 mb-1 block">
                User ID
              </label>
              <input
                id="widget-user-id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your user ID..."
                className="w-full px-4 py-3 border-[2.5px] border-[#1a1a1a] rounded-xl text-sm font-medium shadow-[3px_3px_0_#1a1a1a] focus:shadow-[4px_4px_0_#ff6b35] focus:border-[#ff6b35] transition-all outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#ff6b35] text-white font-black py-3 rounded-xl border-[2.5px] border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1a1a1a] transition-all cursor-pointer"
            >
              Connect Brain
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f0e6d3] font-sans"
      style={{
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-[#ff6b35] border-[2.5px] border-[#1a1a1a] rounded-xl shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center" aria-hidden="true">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-sm">Second Brain</span>

          {/* Search */}
          <form onSubmit={handleSearch} className="ml-auto flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              aria-label="Search brain items"
              className="px-3 py-1.5 border-2 border-[#1a1a1a] rounded-xl text-xs font-medium shadow-[2px_2px_0_#1a1a1a] focus:shadow-[3px_3px_0_#ff6b35] focus:border-[#ff6b35] transition-all outline-none w-40"
            />
            <button
              type="submit"
              aria-label="Search"
              className="w-8 h-8 bg-[#ff6b35] text-white border-2 border-[#1a1a1a] rounded-xl shadow-[2px_2px_0_#1a1a1a] flex items-center justify-center cursor-pointer hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#1a1a1a] transition-all"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Browse items */}
        <div className="space-y-3" role="list" aria-label="Brain items">
          {searchLoading ? (
            <div className="flex items-center justify-center py-12" role="status">
              <Loader2 className="w-6 h-6 animate-spin text-[#ff6b35]" />
              <span className="sr-only">Loading...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-bold text-sm">
              No items found in this brain.
            </div>
          ) : (
            items.map((item) => {
              const Icon = typeIcons[item.type] || FileText;
              return (
                <div
                  key={item.id}
                  role="listitem"
                  className="bg-white border-2 border-[#1a1a1a] rounded-xl p-4 shadow-[3px_3px_0_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-3.5 h-3.5 text-gray-500" aria-hidden="true" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                      {item.type}
                    </span>
                  </div>
                  <h3 className="font-black text-sm mb-1">{item.title}</h3>
                  {item.ai_summary && (
                    <p className="text-xs text-gray-600 font-medium leading-relaxed flex items-start gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#ff6b35] mt-0.5 shrink-0" aria-hidden="true" />
                      {item.ai_summary}
                    </p>
                  )}
                  {item.ai_tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2" role="list" aria-label="Tags">
                      {item.ai_tags.map((tag: string) => (
                        <span
                          key={tag}
                          role="listitem"
                          className="text-[10px] font-bold bg-[#f0e6d3] text-gray-600 rounded px-2 py-0.5 border border-[#1a1a1a]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
