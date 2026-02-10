"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { fetchBrainItems } from "@/app/actions";
import type { BrainItem } from "@/app/lib/types";
import { DEFAULT_TAG_CATEGORIES } from "@/app/lib/types";
import { ProfilePopup } from "@/components/profile-popup";
import { SearchBar } from "@/components/search-bar";
import { NoteCard } from "@/components/note-card";
import { CaptureModal } from "@/components/capture-modal";
import { DetailView } from "@/components/detail-view";
import { BrainQuery } from "@/components/brain-query";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Brain, Sparkles, User, Zap, Tag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardProps {
  initialItems: BrainItem[];
  userEmail?: string;
}

export function Dashboard({ initialItems, userEmail }: DashboardProps) {
  const [items, setItems] = useState<BrainItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedItem, setSelectedItem] = useState<BrainItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchBrainItems(
      search || undefined,
      activeFilter !== "all" ? activeFilter : undefined,
      activeTag || undefined
    );
    setItems(data);
    setIsLoading(false);
  }, [search, activeFilter, activeTag]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => { loadItems(); });
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, activeFilter, activeTag, loadItems, startTransition]);

  const allTags = Array.from(
    new Set(initialItems.flatMap((item) => [...item.tags, ...item.ai_tags]))
  ).filter(Boolean);

  const tagsByCategory = DEFAULT_TAG_CATEGORIES.map((cat) => ({
    ...cat,
    matchedTags: allTags.filter((t) => cat.tags.includes(t)),
  })).filter((cat) => cat.matchedTags.length > 0);

  const uncategorizedTags = allTags.filter(
    (t) => !DEFAULT_TAG_CATEGORIES.some((cat) => cat.tags.includes(t))
  );

  const showSkeleton = isLoading || isPending;
  const filterLabel = activeFilter === "all" ? "All Items" : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1) + "s";

  function handleViewItem(item: BrainItem) {
    setSelectedItem(item);
    setDetailOpen(true);
  }

  return (
    <div className="min-h-screen relative z-1">
      <ProfilePopup open={profileOpen} onClose={() => setProfileOpen(false)} userEmail={userEmail} captureCount={initialItems.length} />

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b-[2.5px] border-(--border)">
          <div className="max-w-7xl mx-auto flex items-center gap-4 px-5 py-4">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-10 h-10 bg-accent neo-border rounded-xl shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:inline font-black text-base tracking-tight">Second Brain</span>
            </div>

            <SearchBar value={search} onChange={setSearch} />

            <Button onClick={() => setCaptureOpen(true)} className="shrink-0 h-12 px-6 rounded-xl">
              <Plus className="w-5 h-5" strokeWidth={3} />
              <span className="hidden sm:inline">Capture</span>
            </Button>

            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="shrink-0 w-10 h-10 rounded-xl bg-purple neo-border shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1a1a1a] transition-all duration-150 cursor-pointer"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-5 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">
                {filterLabel}
                {activeTag && <span className="text-lg text-accent ml-2">#{activeTag}</span>}
              </h2>
              <p className="text-sm font-medium text-(--fg-muted) mt-1">
                {items.length} {items.length === 1 ? "item" : "items"} {search ? `matching "${search}"` : "in your brain"}
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {["all", "note", "link", "insight"].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all duration-150 cursor-pointer ${
                    activeFilter === f
                      ? "bg-accent text-white border-(--border) shadow-[3px_3px_0_#1a1a1a] -translate-x-px -translate-y-px"
                      : "bg-white text-(--fg-muted) border-(--border) shadow-[2px_2px_0_#1a1a1a] hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#1a1a1a] hover:text-foreground"
                  }`}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tags */}
          {(tagsByCategory.length > 0 || uncategorizedTags.length > 0) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-(--fg-muted)" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-(--fg-muted)">Filter by tag</span>
                {activeTag && (
                  <button onClick={() => setActiveTag(null)} className="ml-auto flex items-center gap-1 text-[10px] font-black text-accent hover:text-(--accent-hover) cursor-pointer">
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tagsByCategory.map((cat) =>
                  cat.matchedTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold rounded-lg px-2.5 py-1 border-[1.5px] transition-all duration-150 cursor-pointer ${
                        activeTag === tag
                          ? "bg-accent text-white border-(--border) shadow-[2px_2px_0_#1a1a1a]"
                          : "bg-white text-(--fg-muted) border-(--border) hover:bg-accent/10 hover:text-accent"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                      {tag}
                    </button>
                  ))
                )}
                {uncategorizedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border-[1.5px] transition-all duration-150 cursor-pointer ${
                      activeTag === tag
                        ? "bg-accent text-white border-(--border) shadow-[2px_2px_0_#1a1a1a]"
                        : "bg-white text-(--fg-muted) border-(--border) hover:bg-accent/10 hover:text-accent"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Grid */}
          <AnimatePresence mode="wait">
            {showSkeleton ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </motion.div>
            ) : items.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-28 text-center">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="w-24 h-24 bg-accent/10 neo-border rounded-3xl flex items-center justify-center mb-6 shadow-[4px_4px_0_#1a1a1a]">
                  <Brain className="w-12 h-12 text-accent" />
                </motion.div>
                <h2 className="text-2xl font-black text-foreground mb-2">
                  {search || activeTag ? "No results found" : "Your brain is empty"}
                </h2>
                <p className="text-sm font-medium text-(--fg-muted) mb-6 max-w-sm">
                  {search || activeTag ? "Try a different search term or clear your filters." : "Start capturing ideas, links, and insights. AI will auto-tag and categorize them."}
                </p>
                {!search && !activeTag && (
                  <Button onClick={() => setCaptureOpen(true)} size="lg">
                    <Sparkles className="w-5 h-5" />
                    Capture Your First Idea
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <NoteCard key={item.id} item={item} index={index} onDeleted={loadItems} onClick={() => handleViewItem(item)} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Mobile capture FAB */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 200 }} className="fixed bottom-6 right-6 md:hidden z-30">
          <button
            onClick={() => setCaptureOpen(true)}
            className="w-16 h-16 bg-accent neo-border rounded-2xl shadow-[4px_4px_0_#1a1a1a] flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1a1a1a] active:translate-x-px active:translate-y-px active:shadow-[2px_2px_0_#1a1a1a] transition-all duration-150 cursor-pointer"
          >
            <Zap className="w-7 h-7 text-white" />
          </button>
        </motion.div>
      </div>

      <BrainQuery onViewItem={handleViewItem} />
      <DetailView item={selectedItem} open={detailOpen} onOpenChange={setDetailOpen} onDeleted={loadItems} />
      <CaptureModal open={captureOpen} onOpenChange={setCaptureOpen} onCreated={loadItems} />
    </div>
  );
}
