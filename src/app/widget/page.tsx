"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Send,
  Loader2,
  Brain,
  FileText,
  Link2,
  Lightbulb,
  Sparkles,
  MessageCircle,
} from "lucide-react";

interface WidgetItem {
  id: string;
  title: string;
  type: string;
  ai_summary: string | null;
  tags: string[];
  ai_tags: string[];
}

interface QueryResult {
  answer: string;
  sources: { id: string; title: string; type: string; ai_summary: string }[];
}

export default function WidgetPage() {
  const [userId, setUserId] = useState("");
  const [configured, setConfigured] = useState(false);
  const [mode, setMode] = useState<"search" | "chat">("search");

  // Search state
  const [items, setItems] = useState<WidgetItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string; sources?: QueryResult["sources"] }[]
  >([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Read user_id from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("user_id");
    if (uid) {
      setUserId(uid);
      setConfigured(true);
      fetchItems(uid);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchItems(uid: string) {
    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/public/brain/query?user_id=${uid}&limit=20`
      );
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      // ignore
    }
    setSearchLoading(false);
  }

  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/public/brain/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, user_id: userId }),
      });
      const data: QueryResult = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.answer, sources: data.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, something went wrong." },
      ]);
    }
    setChatLoading(false);
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
  };

  if (!configured) {
    return (
      <div className="min-h-screen bg-[#f0e6d3] flex items-center justify-center p-4"
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
              <label className="text-xs font-black uppercase tracking-wider text-gray-600 mb-1 block">
                User ID
              </label>
              <input
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
          <div className="w-9 h-9 bg-[#ff6b35] border-[2.5px] border-[#1a1a1a] rounded-xl shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-sm">Second Brain</span>

          {/* Mode toggle */}
          <div className="ml-auto flex gap-1 bg-white border-2 border-[#1a1a1a] rounded-xl p-1 shadow-[2px_2px_0_#1a1a1a]">
            <button
              onClick={() => setMode("search")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                mode === "search"
                  ? "bg-[#ff6b35] text-white"
                  : "text-gray-500 hover:text-[#1a1a1a]"
              }`}
            >
              <Search className="w-3 h-3" />
              Browse
            </button>
            <button
              onClick={() => setMode("chat")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                mode === "chat"
                  ? "bg-[#a855f7] text-white"
                  : "text-gray-500 hover:text-[#1a1a1a]"
              }`}
            >
              <MessageCircle className="w-3 h-3" />
              Ask
            </button>
          </div>
        </div>

        {mode === "search" ? (
          /* Browse items */
          <div className="space-y-3">
            {searchLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#ff6b35]" />
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
                    className="bg-white border-2 border-[#1a1a1a] rounded-xl p-4 shadow-[3px_3px_0_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        {item.type}
                      </span>
                    </div>
                    <h3 className="font-black text-sm mb-1">{item.title}</h3>
                    {item.ai_summary && (
                      <p className="text-xs text-gray-600 font-medium leading-relaxed flex items-start gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#ff6b35] mt-0.5 shrink-0" />
                        {item.ai_summary}
                      </p>
                    )}
                    {item.ai_tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.ai_tags.map((tag: string) => (
                          <span
                            key={tag}
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
        ) : (
          /* Chat mode */
          <div className="bg-white border-[2.5px] border-[#1a1a1a] rounded-2xl shadow-[4px_4px_0_#1a1a1a] flex flex-col h-125">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <Sparkles className="w-10 h-10 text-[#a855f7] mb-3" />
                  <h4 className="font-black text-sm mb-1">
                    Ask This Brain Anything
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    I&apos;ll search through the knowledge base and give you answers
                    with sources.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs font-medium leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#ff6b35] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]"
                        : "bg-[#f0e6d3] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#1a1a1a]/20 space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-wider opacity-60">
                          Sources
                        </p>
                        {msg.sources.map((s) => (
                          <div
                            key={s.id}
                            className="text-[11px] font-bold bg-white rounded px-2 py-1 border border-[#1a1a1a]"
                          >
                            📄 {s.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#f0e6d3] rounded-xl px-4 py-3 border-2 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#a855f7]" />
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={handleChat}
              className="flex items-center gap-2 p-3 border-t-[2.5px] border-[#1a1a1a]"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={chatLoading}
                className="flex-1 px-3 py-2.5 border-2 border-[#1a1a1a] rounded-xl text-xs font-medium shadow-[2px_2px_0_#1a1a1a] focus:shadow-[3px_3px_0_#a855f7] focus:border-[#a855f7] transition-all outline-none"
              />
              <button
                type="submit"
                disabled={chatLoading || !input.trim()}
                className="w-10 h-10 bg-[#a855f7] text-white border-2 border-[#1a1a1a] rounded-xl shadow-[2px_2px_0_#1a1a1a] flex items-center justify-center hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#1a1a1a] transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
