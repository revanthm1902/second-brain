"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { fetchBrainItems, vectorSearch, signOut } from "@/app/actions";
import type { BrainItem } from "@/app/lib/types";
import { DEFAULT_TAG_CATEGORIES } from "@/app/lib/types";
import { ProfilePopup } from "@/components/profile-popup";
import { SearchBar } from "@/components/search-bar";
import { NoteCard } from "@/components/note-card";
import { CaptureModal } from "@/components/capture-modal";
import { DetailView } from "@/components/detail-view";
import { FileUploadModal } from "@/components/file-upload-modal";
import { GraphView } from "@/components/graph-view";
import { CommandPalette } from "@/components/command-palette";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Brain, Sparkles, User, Zap, Tag, X, Upload, Network, Keyboard } from "lucide-react";
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
  const [uploadOpen, setUploadOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedItem, setSelectedItem] = useState<BrainItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    let data: BrainItem[];

    if (useSemanticSearch && search && search.trim()) {
      data = await vectorSearch(search);
    } else {
      data = await fetchBrainItems(
        search || undefined,
        activeFilter !== "all" ? activeFilter : undefined,
        activeTag || undefined
      );
    }

    setItems(data);
    setIsLoading(false);
  }, [search, activeFilter, activeTag, useSemanticSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(() => { loadItems(); });
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, activeFilter, activeTag, loadItems, startTransition]);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setCaptureOpen(true);
      }
      if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        setUploadOpen(true);
      }
      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        setGraphOpen(true);
      }
      if (e.key === "Escape") {
        setShortcutsOpen(false);
      }
    }
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (shortcutsOpen && !target.closest("[data-shortcuts-popup]")) {
        setShortcutsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleClick);
    };
  }, [shortcutsOpen]);

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

  function handleSignOut() {
    signOut().then(() => (window.location.href = "/login"));
  }

  return (
    <div className="min-h-screen relative z-1" role="main">
      <ProfilePopup open={profileOpen} onClose={() => setProfileOpen(false)} userEmail={userEmail} captureCount={initialItems.length} />

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b-[2.5px] border-(--border)" role="banner">
          <div className="max-w-7xl mx-auto flex items-center gap-4 px-5 py-4">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-10 h-10 bg-accent neo-border rounded-xl shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center" aria-hidden="true">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:inline font-black text-base tracking-tight">Second Brain</span>
            </div>

            <SearchBar value={search} onChange={setSearch} />

            {/* Semantic search toggle */}
            <button
              onClick={() => setUseSemanticSearch(!useSemanticSearch)}
              title={useSemanticSearch ? "Semantic search (AI)" : "Text search"}
              aria-label={useSemanticSearch ? "Switch to text search" : "Switch to semantic search"}
              aria-pressed={useSemanticSearch}
              className={`shrink-0 w-10 h-10 rounded-xl neo-border shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1a1a1a] transition-all duration-150 cursor-pointer ${
                useSemanticSearch ? "bg-accent text-white" : "bg-white text-(--fg-muted)"
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </button>

            <Button onClick={() => setCaptureOpen(true)} className="shrink-0 h-12 px-6 rounded-xl" aria-label="Capture new idea">
              <Plus className="w-5 h-5" strokeWidth={3} />
              <span className="hidden sm:inline">Capture</span>
            </Button>

            <button
              onClick={() => setUploadOpen(true)}
              title="Upload document"
              aria-label="Upload document"
              className="shrink-0 w-10 h-10 rounded-xl bg-neo-green neo-border shadow-[3px_3px_0_#1a1a1a] items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1a1a1a] transition-all duration-150 cursor-pointer hidden sm:flex"
            >
              <Upload className="w-4 h-4 text-white" />
            </button>

            <button
              onClick={() => setGraphOpen(true)}
              title="Knowledge graph"
              aria-label="Open knowledge graph"
              className="shrink-0 w-10 h-10 rounded-xl bg-neo-cyan neo-border shadow-[3px_3px_0_#1a1a1a] items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1a1a1a] transition-all duration-150 cursor-pointer hidden sm:flex"
            >
              <Network className="w-4 h-4 text-white" />
            </button>

            {/* Shortcuts button */}
            <div className="relative" data-shortcuts-popup>
              <button
                onClick={() => setShortcutsOpen(!shortcutsOpen)}
                title="Keyboard shortcuts"
                aria-label="Show keyboard shortcuts"
                aria-expanded={shortcutsOpen}
                className="shrink-0 w-10 h-10 rounded-xl bg-white neo-border shadow-[3px_3px_0_#1a1a1a] items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1a1a1a] transition-all duration-150 cursor-pointer hidden sm:flex"
              >
                <Keyboard className="w-4 h-4 text-(--fg-muted)" />
              </button>
              <AnimatePresence>
                {shortcutsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-64 bg-white neo-border rounded-xl shadow-[4px_4px_0_#1a1a1a] p-4 z-50"
                  >
                    <h3 className="text-xs font-black uppercase tracking-widest text-(--fg-muted) mb-3">Keyboard Shortcuts</h3>
                    <div className="space-y-2">
                      {[
                        { keys: "Ctrl + K", label: "Command palette" },
                        { keys: "N", label: "New capture" },
                        { keys: "U", label: "Upload file" },
                        { keys: "G", label: "Knowledge graph" },
                        { keys: "Esc", label: "Close dialog" },
                      ].map((s) => (
                        <div key={s.keys} className="flex items-center justify-between">
                          <span className="text-xs font-medium text-(--fg-muted)">{s.label}</span>
                          <kbd className="text-[10px] font-black bg-background border-2 border-(--border) rounded-lg px-2 py-0.5 shadow-[1px_1px_0_#1a1a1a]">{s.keys}</kbd>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="User profile"
              aria-expanded={profileOpen}
              className="shrink-0 w-10 h-10 rounded-xl bg-purple neo-border shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1a1a1a] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1a1a1a] transition-all duration-150 cursor-pointer"
            >
              <User className="w-5 h-5 text-white" />
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-5 py-8" aria-label="Brain items">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">
                {filterLabel}
                {activeTag && <span className="text-lg text-accent ml-2">#{activeTag}</span>}
              </h2>
              <p className="text-sm font-medium text-(--fg-muted) mt-1">
                {items.length} {items.length === 1 ? "item" : "items"} {search ? `matching "${search}"` : "in your brain"}
                {useSemanticSearch && search && " (semantic)"}
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2" role="tablist" aria-label="Filter items by type">
              {["all", "note", "link", "insight"].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  role="tab"
                  aria-selected={activeFilter === f}
                  aria-label={`Filter by ${f === "all" ? "all types" : f + "s"}`}
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6" role="region" aria-label="Tag filters">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-(--fg-muted)" aria-hidden="true" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-(--fg-muted)">Filter by tag</span>
                {activeTag && (
                  <button onClick={() => setActiveTag(null)} className="ml-auto flex items-center gap-1 text-[10px] font-black text-accent hover:text-(--accent-hover) cursor-pointer" aria-label="Clear tag filter">
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Available tags">
                {tagsByCategory.map((cat) =>
                  cat.matchedTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      aria-pressed={activeTag === tag}
                      aria-label={`Filter by tag: ${tag}`}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold rounded-lg px-2.5 py-1 border-[1.5px] transition-all duration-150 cursor-pointer ${
                        activeTag === tag
                          ? "bg-accent text-white border-(--border) shadow-[2px_2px_0_#1a1a1a]"
                          : "bg-white text-(--fg-muted) border-(--border) hover:bg-accent/10 hover:text-accent"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} aria-hidden="true" />
                      {tag}
                    </button>
                  ))
                )}
                {uncategorizedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    aria-pressed={activeTag === tag}
                    aria-label={`Filter by tag: ${tag}`}
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
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" role="status" aria-label="Loading items">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </motion.div>
            ) : items.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-28 text-center">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="w-24 h-24 bg-accent/10 neo-border rounded-3xl flex items-center justify-center mb-6 shadow-[4px_4px_0_#1a1a1a]" aria-hidden="true">
                  <Brain className="w-12 h-12 text-accent" />
                </motion.div>
                <h2 className="text-2xl font-black text-foreground mb-2">
                  {search || activeTag ? "No results found" : "Your brain is empty"}
                </h2>
                <p className="text-sm font-medium text-(--fg-muted) mb-6 max-w-sm">
                  {search || activeTag ? "Try a different search term or clear your filters." : "Start capturing ideas, links, and insights. AI will auto-tag and categorize them."}
                </p>
                {!search && !activeTag && (
                  <div className="flex gap-3">
                    <Button onClick={() => setCaptureOpen(true)} size="lg">
                      <Sparkles className="w-5 h-5" />
                      Capture Your First Idea
                    </Button>
                    <Button onClick={() => setUploadOpen(true)} size="lg" variant="outline">
                      <Upload className="w-5 h-5" />
                      Upload a File
                    </Button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" role="list" aria-label="Brain items list">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <div key={item.id} role="listitem">
                      <NoteCard item={item} index={index} onDeleted={loadItems} onClick={() => handleViewItem(item)} />
                    </div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Mobile FAB group */}
        <div className="fixed bottom-6 right-6 md:hidden z-30 flex flex-col gap-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 200 }}>
            <button
              onClick={() => setUploadOpen(true)}
              aria-label="Upload document"
              className="w-14 h-14 bg-neo-green neo-border rounded-2xl shadow-[4px_4px_0_#1a1a1a] flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1a1a1a] active:translate-x-px active:translate-y-px active:shadow-[2px_2px_0_#1a1a1a] transition-all duration-150 cursor-pointer"
            >
              <Upload className="w-6 h-6 text-white" />
            </button>
          </motion.div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring", stiffness: 200 }}>
            <button
              onClick={() => setCaptureOpen(true)}
              aria-label="Capture new idea"
              className="w-16 h-16 bg-accent neo-border rounded-2xl shadow-[4px_4px_0_#1a1a1a] flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1a1a1a] active:translate-x-px active:translate-y-px active:shadow-[2px_2px_0_#1a1a1a] transition-all duration-150 cursor-pointer"
            >
              <Zap className="w-7 h-7 text-white" />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t-[2.5px] border-(--border) bg-background/80 backdrop-blur-md mt-12">
        <div className="max-w-7xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <p className="text-xs font-bold text-(--fg-muted)">
              Made with <span className="text-red-500">&#10084;</span> by{" "}
              <a
                href="https://revanthm.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-accent hover:text-(--accent-hover) transition-colors"
              >
                Revanth Modalavalasa
              </a>
            </p>
            <p className="text-[10px] font-bold text-(--fg-muted)">
              &copy; {new Date().getFullYear()} Second Brain. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://revanthm.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Website"
              className="w-9 h-9 rounded-xl bg-white neo-border shadow-[2px_2px_0_#1a1a1a] flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1a1a1a] transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 text-(--fg-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
            </a>
            <a
              href="https://www.linkedin.com/in/modalavalasa-revanth/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-xl bg-white neo-border shadow-[2px_2px_0_#1a1a1a] flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1a1a1a] transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 text-(--fg-muted)" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
            </a>
            <a
              href="https://github.com/revanthm1902"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="w-9 h-9 rounded-xl bg-white neo-border shadow-[2px_2px_0_#1a1a1a] flex items-center justify-center hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#1a1a1a] transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 text-(--fg-muted)" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
            </a>
          </div>
        </div>
      </footer>

      {/* Dialogs */}
      <DetailView item={selectedItem} open={detailOpen} onOpenChange={setDetailOpen} onDeleted={loadItems} />
      <CaptureModal open={captureOpen} onOpenChange={setCaptureOpen} onCreated={loadItems} />
      <FileUploadModal open={uploadOpen} onOpenChange={setUploadOpen} onCreated={loadItems} />
      <GraphView open={graphOpen} onOpenChange={setGraphOpen} onViewItem={handleViewItem} />
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onCapture={() => setCaptureOpen(true)}
        onUpload={() => setUploadOpen(true)}
        onGraph={() => setGraphOpen(true)}
        onViewItem={handleViewItem}
        onSignOut={handleSignOut}
      />
    </div>
  );
}
