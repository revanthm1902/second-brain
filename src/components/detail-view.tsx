"use client";

import type { BrainItem } from "@/app/lib/types";
import { formatDate } from "@/app/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Link2, Lightbulb, Sparkles, Tag, FolderOpen, Calendar, Trash2, Copy, Check, BookOpen, HelpCircle, Pencil, X } from "lucide-react";
import { motion } from "framer-motion";
import { deleteBrainItem, updateBrainItem } from "@/app/actions";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const typeConfig: Record<string, { icon: typeof FileText; label: string; color: string; accent: string }> = {
  note: { icon: FileText, label: "Note", color: "bg-blue-100 text-blue-800", accent: "#3b82f6" },
  link: { icon: Link2, label: "Link", color: "bg-green-100 text-green-800", accent: "#22c55e" },
  insight: { icon: Lightbulb, label: "Insight", color: "bg-yellow-100 text-yellow-800", accent: "#eab308" },
  article: { icon: BookOpen, label: "Article", color: "bg-purple-100 text-purple-800", accent: "#a855f7" },
};

const defaultTypeConfig = { icon: HelpCircle, label: "Other", color: "bg-gray-100 text-gray-800", accent: "#6b7280" };

interface DetailViewProps {
  item: BrainItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DetailView({ item, open, onOpenChange, onDeleted }: DetailViewProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!item) return null;

  const config = typeConfig[item.type] || { ...defaultTypeConfig, label: item.type.charAt(0).toUpperCase() + item.type.slice(1) };
  const Icon = config.icon;
  const allTags = [...item.tags, ...item.ai_tags.filter((t) => !item.tags.includes(t))];

  async function handleDelete() {
    if (!item || isDeleting) return;
    setIsDeleting(true);
    setError(null);
    try {
      const result = await deleteBrainItem(item.id);
      if (result.success) { onOpenChange(false); onDeleted(); }
      else setError(result.error || "Failed to delete.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete. Please try again.");
    }
    setIsDeleting(false);
  }

  function handleCopy() {
    if (!item) return;
    navigator.clipboard.writeText(`${item.title}\n\n${item.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function startEditing() {
    if (!item) return;
    setEditTitle(item.title);
    setEditContent(item.content);
    setIsEditing(true);
    setError(null);
  }

  async function handleSave() {
    if (!item || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const result = await updateBrainItem(item.id, { title: editTitle, content: editContent });
      if (result.success) {
        setIsEditing(false);
        onOpenChange(false);
        onDeleted();
      } else {
        setError(result.error || "Failed to save.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Body exceeded") || message.includes("body size")) {
        setError("Content is too large. Please shorten it and try again.");
      } else {
        setError(message || "Failed to save. Please try again.");
      }
    }
    setIsSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setIsEditing(false); }}>
      <DialogContent className="sm:max-w-160 max-h-[85vh] overflow-hidden flex flex-col" onWheel={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 neo-border rounded-xl shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center" style={{ background: config.accent }}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="font-black text-xl" />
              ) : (
                <h2 className="font-black text-xl text-foreground truncate">{item.title}</h2>
              )}
              <p className="text-[10px] font-bold text-(--fg-muted) uppercase tracking-widest">Second Brain</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2 overflow-y-auto flex-1 pr-1" style={{ overscrollBehavior: "contain" }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider ${config.color} rounded-lg px-2.5 py-1.5 border-2 border-(--border) shadow-[2px_2px_0_#1a1a1a]`}>
              <Icon className="w-3 h-3" />{config.label}
            </span>
            {item.ai_category && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black bg-purple/10 text-purple rounded-lg px-2.5 py-1.5 border-2 border-purple/30">
                <FolderOpen className="w-3 h-3" />{item.ai_category}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-(--fg-muted) ml-auto">
              <Calendar className="w-3 h-3" />{formatDate(item.created_at)}
            </span>
          </div>

          {item.ai_summary && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5 text-sm text-accent bg-accent/5 rounded-xl px-4 py-3.5 border-2 border-accent/30 font-bold leading-relaxed">
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{item.ai_summary}</span>
            </motion.div>
          )}

          <div className="bg-background border-2 border-(--border) rounded-xl p-5 shadow-[2px_2px_0_#1a1a1a]">
            {isEditing ? (
              <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="min-h-40 text-sm font-medium leading-relaxed" />
            ) : (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-medium select-text">{item.content}</p>
            )}
          </div>

          {allTags.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-(--fg-muted) mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs font-bold bg-white text-foreground rounded-lg px-3 py-1.5 border-2 border-(--border) shadow-[2px_2px_0_#1a1a1a] hover:bg-accent hover:text-white hover:border-accent transition-all duration-150">
                    <Tag className="w-3 h-3" />{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm font-bold text-red-600 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3">
              <X className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t-2 border-(--border)">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? <><Check className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
            </Button>
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
                  {isSaving ? "Saving..." : <><Check className="w-3.5 h-3.5" />Save</>}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="gap-1.5">
                  <X className="w-3.5 h-3.5" />Cancel
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={startEditing} className="gap-1.5">
                <Pencil className="w-3.5 h-3.5" />Edit
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={isDeleting} className="gap-1.5 text-red-600 hover:bg-red-50 hover:border-red-300">
              <Trash2 className="w-3.5 h-3.5" />{isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
