"use client";

import type { BrainItem } from "@/app/lib/types";
import { formatDate } from "@/app/lib/utils";
import { FileText, Link2, Lightbulb, Trash2, Sparkles, FolderOpen, Tag, BookOpen, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { deleteBrainItem } from "@/app/actions";
import { useState } from "react";

const typeConfig: Record<string, { icon: typeof FileText; label: string; color: string; accent: string }> = {
  note: { icon: FileText, label: "Note", color: "bg-blue-100 text-blue-800", accent: "#3b82f6" },
  link: { icon: Link2, label: "Link", color: "bg-green-100 text-green-800", accent: "#22c55e" },
  insight: { icon: Lightbulb, label: "Insight", color: "bg-yellow-100 text-yellow-800", accent: "#eab308" },
  article: { icon: BookOpen, label: "Article", color: "bg-purple-100 text-purple-800", accent: "#a855f7" },
};

const defaultTypeConfig = { icon: HelpCircle, label: "Other", color: "bg-gray-100 text-gray-800", accent: "#6b7280" };

interface NoteCardProps {
  item: BrainItem;
  index: number;
  onDeleted: () => void;
  onClick?: () => void;
}

export function NoteCard({ item, index, onDeleted, onClick }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const config = typeConfig[item.type] || { ...defaultTypeConfig, label: item.type.charAt(0).toUpperCase() + item.type.slice(1) };
  const Icon = config.icon;
  const allTags = [...item.tags, ...item.ai_tags.filter((t) => !item.tags.includes(t))];

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (isDeleting) return;
    setIsDeleting(true);
    const result = await deleteBrainItem(item.id);
    if (result.success) onDeleted();
    setIsDeleting(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3), ease: [0.25, 1, 0.5, 1] }}
      whileHover={{ translateX: -2, translateY: -2, boxShadow: "6px 6px 0 #1a1a1a" }}
      whileTap={{ translateX: 1, translateY: 1, boxShadow: "2px 2px 0 #1a1a1a" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick?.(); } }}
      role="article"
      tabIndex={0}
      aria-label={`${config.label}: ${item.title}${item.ai_category ? ` — ${item.ai_category}` : ""}`}
      className="group relative p-6 bg-white rounded-2xl neo-border shadow-[4px_4px_0_#1a1a1a] cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
    >
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: config.accent }} />

      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label={`Delete ${item.title}`}
        className="absolute top-4 right-4 w-8 h-8 rounded-lg border-2 border-(--border) bg-white flex items-center justify-center shadow-[2px_2px_0_#1a1a1a] hover:bg-red-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#1a1a1a] transition-all duration-150 cursor-pointer z-10"
      >
        <Trash2 className="w-3.5 h-3.5 text-red-500" />
      </motion.button>

      <div className="flex items-center gap-2 mb-3">
        <div className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider ${config.color} rounded-lg px-2.5 py-1.5 border-2 border-(--border) shadow-[2px_2px_0_#1a1a1a]`}>
          <Icon className="w-3 h-3" />{config.label}
        </div>
        {item.ai_category && (
          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-purple/10 text-purple rounded-lg px-2 py-1 border-[1.5px] border-purple/30">
            <FolderOpen className="w-2.5 h-2.5" />{item.ai_category}
          </span>
        )}
      </div>

      <h3 className="font-black text-lg text-foreground mb-2 leading-tight line-clamp-2">{item.title}</h3>
      <p className="text-sm text-(--fg-muted) line-clamp-3 mb-3 leading-relaxed font-medium">{item.content}</p>

      {item.ai_summary && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 text-xs text-accent bg-accent/5 rounded-xl px-3 py-2.5 mb-3 border-2 border-accent/30 font-bold">
          <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{item.ai_summary}</span>
        </motion.div>
      )}

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {allTags.slice(0, 4).map((tag) => (
            <span key={tag} className="inline-flex items-center gap-0.5 text-[11px] font-bold bg-background text-(--fg-muted) rounded-lg px-2.5 py-1 border-[1.5px] border-(--border) hover:bg-accent hover:text-white hover:border-accent transition-all duration-150 cursor-default">
              <Tag className="w-2.5 h-2.5" />{tag}
            </span>
          ))}
          {allTags.length > 4 && <span className="text-[11px] font-bold text-(--fg-muted) rounded-lg px-2 py-1">+{allTags.length - 4}</span>}
        </div>
      )}

      <p className="text-[11px] font-bold text-(--fg-muted) uppercase tracking-wider">{formatDate(item.created_at)}</p>
    </motion.div>
  );
}
