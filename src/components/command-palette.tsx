"use client";

import { useEffect, useState, useRef } from "react";
import { Command } from "cmdk";
import { fetchBrainItems } from "@/app/actions";
import type { BrainItem } from "@/app/lib/types";
import {
  Search, Plus, Upload, FileText, Link2, Lightbulb, X,
  LogOut, BookOpen, HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: () => void;
  onUpload: () => void;
  onViewItem: (item: BrainItem) => void;
  onSignOut: () => void;
}

const typeIcons: Record<string, typeof FileText> = { note: FileText, link: Link2, insight: Lightbulb, article: BookOpen };

export function CommandPalette({
  open,
  onOpenChange,
  onCapture,
  onUpload,
  onViewItem,
  onSignOut,
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<BrainItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when palette opens (React-recommended prop-derived state pattern)
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSearch("");
      setResults([]);
    }
  }

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Search items when query changes
  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(async () => {
      if (search.trim()) {
        const items = await fetchBrainItems(search);
        setResults(items.slice(0, 8));
      } else {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [search, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  function runAction(action: () => void) {
    onOpenChange(false);
    action();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />

          {/* Command palette */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
            role="dialog"
            aria-label="Command palette"
            aria-modal="true"
          >
            <Command
              className="bg-white neo-border rounded-2xl shadow-[6px_6px_0_#1a1a1a] overflow-hidden"
              label="Command palette"
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b-[2.5px] border-(--border)">
                <Search className="w-5 h-5 text-(--fg-muted) shrink-0" />
                <Command.Input
                  ref={inputRef}
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search notes or type a command..."
                  className="flex-1 text-sm font-medium outline-none bg-transparent placeholder:text-(--fg-muted)"
                  aria-label="Search or command"
                />
                <button
                  onClick={() => onOpenChange(false)}
                  className="shrink-0 w-7 h-7 rounded-lg border-2 border-(--border) bg-background flex items-center justify-center shadow-[2px_2px_0_#1a1a1a] hover:bg-red-100 transition-all cursor-pointer"
                  aria-label="Close command palette"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm font-bold text-(--fg-muted)">
                  No results found.
                </Command.Empty>

                {/* Quick actions */}
                {!search && (
                  <Command.Group heading="Quick Actions" className="px-2 py-1">
                    <Command.Item
                      onSelect={() => runAction(onCapture)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all hover:bg-accent/10 data-selected:bg-accent/10 data-selected:text-accent"
                      value="capture new idea"
                    >
                      <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center border-2 border-accent/30">
                        <Plus className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">Capture Idea</p>
                        <p className="text-xs text-(--fg-muted) font-medium">Create a new note, link, or insight</p>
                      </div>
                      <kbd className="text-[10px] font-black text-(--fg-muted) bg-background border-2 border-(--border) rounded-lg px-2 py-0.5 shadow-[1px_1px_0_#1a1a1a]">N</kbd>
                    </Command.Item>

                    <Command.Item
                      onSelect={() => runAction(onUpload)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all hover:bg-neo-green/10 data-selected:bg-neo-green/10 data-selected:text-neo-green"
                      value="upload file document"
                    >
                      <div className="w-8 h-8 bg-neo-green/10 rounded-lg flex items-center justify-center border-2 border-neo-green/30">
                        <Upload className="w-4 h-4 text-neo-green" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">Upload Document</p>
                        <p className="text-xs text-(--fg-muted) font-medium">Upload and analyze a file</p>
                      </div>
                      <kbd className="text-[10px] font-black text-(--fg-muted) bg-background border-2 border-(--border) rounded-lg px-2 py-0.5 shadow-[1px_1px_0_#1a1a1a]">U</kbd>
                    </Command.Item>

                    <Command.Item
                      onSelect={() => runAction(onSignOut)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all hover:bg-red-50 data-selected:bg-red-50 data-selected:text-red-600"
                      value="sign out logout"
                    >
                      <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200">
                        <LogOut className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">Sign Out</p>
                        <p className="text-xs text-(--fg-muted) font-medium">Log out of your account</p>
                      </div>
                    </Command.Item>
                  </Command.Group>
                )}

                {/* Search results */}
                {results.length > 0 && (
                  <Command.Group heading="Notes" className="px-2 py-1">
                    {results.map((item) => {
                      const Icon = typeIcons[item.type] || HelpCircle;
                      return (
                        <Command.Item
                          key={item.id}
                          onSelect={() => runAction(() => onViewItem(item))}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all hover:bg-accent/10 data-selected:bg-accent/10"
                          value={`${item.title} ${item.ai_tags?.join(" ")}`}
                        >
                          <Icon className="w-4 h-4 text-(--fg-muted) shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{item.title}</p>
                            {item.ai_summary && (
                              <p className="text-xs text-(--fg-muted) font-medium truncate">{item.ai_summary}</p>
                            )}
                          </div>
                          {item.ai_category && (
                            <span className="text-[10px] font-black bg-purple/10 text-purple rounded px-2 py-0.5 border border-purple/20 shrink-0">
                              {item.ai_category}
                            </span>
                          )}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                )}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center gap-4 px-5 py-2.5 border-t-[2.5px] border-(--border) bg-background/50">
                <span className="text-[10px] font-bold text-(--fg-muted)">
                  <kbd className="bg-white border border-(--border) rounded px-1 py-0.5 mr-1 font-black shadow-[1px_1px_0_#1a1a1a]">↑↓</kbd>
                  Navigate
                </span>
                <span className="text-[10px] font-bold text-(--fg-muted)">
                  <kbd className="bg-white border border-(--border) rounded px-1 py-0.5 mr-1 font-black shadow-[1px_1px_0_#1a1a1a]">↵</kbd>
                  Select
                </span>
                <span className="text-[10px] font-bold text-(--fg-muted)">
                  <kbd className="bg-white border border-(--border) rounded px-1 py-0.5 mr-1 font-black shadow-[1px_1px_0_#1a1a1a]">Esc</kbd>
                  Close
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
