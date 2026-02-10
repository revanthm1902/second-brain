"use client";

import { useState, useRef, useEffect } from "react";
import { queryBrain } from "@/app/actions";
import type { BrainItem, ConversationMessage } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Loader2, Brain, X, Sparkles, FileText, Link2, Lightbulb, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BrainQueryProps {
  onViewItem?: (item: BrainItem) => void;
}

export function BrainQuery({ onViewItem }: BrainQueryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);
    const result = await queryBrain(question);
    setMessages((prev) => [...prev, { role: "assistant", content: result.answer, sources: result.sources }]);
    setLoading(false);
  }

  const typeIcons = { note: FileText, link: Link2, insight: Lightbulb };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 left-6 z-30 w-14 h-14 bg-purple neo-border rounded-2xl shadow-[4px_4px_0_#1a1a1a] flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1a1a1a] active:translate-x-px active:translate-y-px active:shadow-[2px_2px_0_#1a1a1a] transition-all duration-150 cursor-pointer"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 left-6 z-40 w-95 max-w-[calc(100vw-3rem)] h-130 bg-white neo-border rounded-2xl shadow-[6px_6px_0_#1a1a1a] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b-[2.5px] border-(--border) bg-purple/5">
              <div className="w-9 h-9 bg-purple border-2 border-(--border) rounded-xl shadow-[2px_2px_0_#1a1a1a] flex items-center justify-center">
                <Brain className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-sm text-foreground">Ask Your Brain</h3>
                <p className="text-[10px] font-bold text-(--fg-muted) uppercase tracking-wider">Second Brain · AI search</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg border-2 border-(--border) bg-white flex items-center justify-center shadow-[2px_2px_0_#1a1a1a] hover:bg-red-100 transition-all duration-150 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-16 h-16 bg-purple/10 border-2 border-purple/30 rounded-2xl flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-purple" />
                  </div>
                  <h4 className="font-black text-sm text-foreground mb-1">Query Your Knowledge</h4>
                  <p className="text-xs text-(--fg-muted) font-medium leading-relaxed">
                    Ask anything about your notes, links, and insights. I&apos;ll find the answers from your brain.
                  </p>
                  <div className="mt-4 space-y-1.5 w-full">
                    {["What did I learn about React?", "Summarize my recent insights", "What links did I save about AI?"].map((q) => (
                      <button key={q} onClick={() => setInput(q)} className="w-full text-left text-xs font-bold text-(--fg-muted) bg-background rounded-lg px-3 py-2 border-[1.5px] border-(--border) hover:bg-purple/10 hover:text-purple hover:border-purple/30 transition-all duration-150 cursor-pointer">
                        &quot;{q}&quot;
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs font-medium leading-relaxed ${msg.role === "user" ? "bg-accent text-white border-2 border-(--border) shadow-[2px_2px_0_#1a1a1a]" : "bg-background text-foreground border-2 border-(--border) shadow-[2px_2px_0_#1a1a1a]"}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-(--border)/30 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-(--fg-muted)">Sources</p>
                        {msg.sources.map((src) => {
                          const SrcIcon = typeIcons[src.type] || typeIcons.note;
                          return (
                            <button key={src.id} onClick={() => onViewItem?.(src)} className="w-full flex items-center gap-2 text-left bg-white rounded-lg px-2.5 py-1.5 border-[1.5px] border-(--border) hover:bg-accent/10 transition-all duration-150 cursor-pointer">
                              <SrcIcon className="w-3 h-3 text-(--fg-muted) shrink-0" />
                              <span className="text-[11px] font-bold text-foreground truncate">{src.title}</span>
                              <ChevronDown className="w-3 h-3 text-(--fg-muted) shrink-0 -rotate-90" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-background rounded-xl px-4 py-3 border-2 border-(--border) shadow-[2px_2px_0_#1a1a1a]">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple" />
                      <span className="text-xs font-bold text-(--fg-muted)">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t-[2.5px] border-(--border)">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your brain..." className="flex-1 h-10 text-xs" disabled={loading} />
              <Button type="submit" size="icon" disabled={loading || !input.trim()} className="h-10 w-10 rounded-xl shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
