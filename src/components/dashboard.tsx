"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { fetchBrainItems } from "@/app/actions";
import type { BrainItem } from "@/app/lib/types";
import { Sidebar } from "@/components/sidebar";
import { SearchBar } from "@/components/search-bar";
import { NoteCard } from "@/components/note-card";
import { CaptureModal } from "@/components/capture-modal";
import { MobileNav } from "@/components/mobile-nav";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Brain, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardProps {
  initialItems: BrainItem[];
}

export function Dashboard({ initialItems }: DashboardProps) {
  const [items, setItems] = useState<BrainItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [captureOpen, setCaptureOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchBrainItems(
      search || undefined,
      activeFilter !== "all" ? activeFilter : undefined
    );
    setItems(data);
    setIsLoading(false);
  }, [search, activeFilter]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => {
        loadItems();
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, activeFilter, loadItems, startTransition]);

  const itemCounts = {
    all: initialItems.length,
    note: initialItems.filter((i) => i.type === "note").length,
    link: initialItems.filter((i) => i.type === "link").length,
    insight: initialItems.filter((i) => i.type === "insight").length,
  };

  const showSkeleton = isLoading || isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 flex">
      {/* Sidebar */}
      <Sidebar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        itemCounts={itemCounts}
      />

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/60 backdrop-blur-2xl border-b border-slate-200/50">
          <div className="flex items-center gap-4 px-6 py-4">
            <MobileNav
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            <SearchBar value={search} onChange={setSearch} />

            <Button
              onClick={() => setCaptureOpen(true)}
              className="shrink-0 h-12 px-6 rounded-2xl shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Capture</span>
            </Button>
          </div>
        </header>

        {/* Content */}
        <section className="flex-1 p-6">
          <AnimatePresence mode="wait">
            {showSkeleton ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </motion.div>
            ) : items.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6">
                  <Brain className="w-10 h-10 text-indigo-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  {search
                    ? "No results found"
                    : "Your brain is empty"}
                </h2>
                <p className="text-sm text-slate-500 mb-6 max-w-sm">
                  {search
                    ? "Try a different search term or clear your filters."
                    : "Start capturing ideas, links, and insights. AI will help you organize them."}
                </p>
                {!search && (
                  <Button
                    onClick={() => setCaptureOpen(true)}
                    className="rounded-2xl"
                  >
                    <Sparkles className="w-4 h-4" />
                    Capture Your First Idea
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              >
                <AnimatePresence>
                  {items.map((item, index) => (
                    <NoteCard
                      key={item.id}
                      item={item}
                      index={index}
                      onDeleted={loadItems}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Capture Modal */}
      <CaptureModal
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        onCreated={loadItems}
      />
    </div>
  );
}
