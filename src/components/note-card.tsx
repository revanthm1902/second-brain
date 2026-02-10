"use client";

import type { BrainItem } from "@/app/lib/types";
import { formatDate } from "@/app/lib/utils";
import { FileText, Link2, Lightbulb, Trash2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { deleteBrainItem } from "@/app/actions";
import { useState } from "react";

const typeConfig = {
  note: {
    icon: FileText,
    label: "Note",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  link: {
    icon: Link2,
    label: "Link",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  insight: {
    icon: Lightbulb,
    label: "Insight",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
};

interface NoteCardProps {
  item: BrainItem;
  index: number;
  onDeleted: () => void;
}

export function NoteCard({ item, index, onDeleted }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const config = typeConfig[item.type] || typeConfig.note;
  const Icon = config.icon;

  const allTags = [
    ...item.tags,
    ...item.ai_tags.filter((t) => !item.tags.includes(t)),
  ];

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (isDeleting) return;
    setIsDeleting(true);
    const result = await deleteBrainItem(item.id);
    if (result.success) {
      onDeleted();
    }
    setIsDeleting(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{
        duration: 0.35,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group relative p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-slate-300/80 transition-all duration-300 cursor-pointer"
    >
      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-4 right-4 p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all duration-200 cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Type badge */}
      <div
        className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${config.color} ${config.bg} ${config.border} border rounded-full px-2.5 py-1 mb-3`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-lg text-slate-900 mb-2 leading-tight line-clamp-2">
        {item.title}
      </h3>

      {/* Content preview */}
      <p className="text-sm text-slate-500 line-clamp-3 mb-3 leading-relaxed">
        {item.content}
      </p>

      {/* AI Summary */}
      {item.ai_summary && (
        <div className="flex items-start gap-2 text-xs text-indigo-600 bg-indigo-50/50 rounded-xl px-3 py-2 mb-3 border border-indigo-100/50">
          <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{item.ai_summary}</span>
        </div>
      )}

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {allTags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium bg-slate-100 text-slate-500 rounded-full px-2.5 py-0.5 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Date */}
      <p className="text-[11px] text-slate-400">{formatDate(item.created_at)}</p>
    </motion.div>
  );
}
