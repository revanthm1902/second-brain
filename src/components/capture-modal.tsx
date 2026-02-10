"use client";

import { useState } from "react";
import { createBrainItem } from "@/app/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ITEM_TYPES } from "@/app/lib/types";
import { Loader2, Sparkles, Check, Zap, Tag, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CaptureModal({ open, onOpenChange, onCreated }: CaptureModalProps) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("note");
  const [aiResult, setAiResult] = useState<{ summary: string; tags: string[]; category: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setAiResult(null);
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    const result = await createBrainItem(formData);
    if (result.success && result.item) {
      setAiResult({ summary: result.item.ai_summary || "", tags: result.item.ai_tags || [], category: result.item.ai_category || "Learning" });
      setTimeout(() => { onOpenChange(false); setAiResult(null); onCreated(); }, 3000);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-170">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent neo-border rounded-xl shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block">Capture Idea</span>
              <span className="block text-[10px] font-bold text-(--fg-muted) uppercase tracking-widest">Second Brain</span>
            </div>
          </DialogTitle>
          <DialogDescription>Drop a thought into your brain. AI will auto-summarize, tag, and categorize it.</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {aiResult ? (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="py-8 text-center space-y-5">
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }} className="w-18 h-18 bg-neo-green neo-border rounded-2xl flex items-center justify-center mx-auto shadow-[4px_4px_0_#1a1a1a]">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </motion.div>
              <div>
                <h3 className="font-black text-lg text-foreground mb-2">Captured & Analyzed! 🧠</h3>
                <p className="text-sm text-(--fg-muted) font-medium italic px-4 leading-relaxed">&quot;{aiResult.summary}&quot;</p>
              </div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-black bg-purple/10 text-purple rounded-lg px-3 py-1.5 border-2 border-purple/30 shadow-[2px_2px_0_var(--purple)]">
                  <FolderOpen className="w-3.5 h-3.5" />{aiResult.category}
                </span>
              </motion.div>
              <div className="flex justify-center flex-wrap gap-2">
                {aiResult.tags.map((tag, i) => (
                  <motion.span key={tag} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="text-xs font-black bg-accent/10 text-accent rounded-lg px-3 py-1.5 border-2 border-accent/30 shadow-[2px_2px_0_var(--accent)]">
                    <Tag className="w-3 h-3 inline mr-1" />{tag}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="What's on your mind?" required autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" name="content" placeholder="Write your thoughts, paste a link, or describe an insight..." required className="min-h-45 sm:min-h-50" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ITEM_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-(--fg-muted) bg-accent/5 rounded-xl px-4 py-3 border-2 border-accent/20">
                <Sparkles className="w-4 h-4 text-accent shrink-0" />
                AI will auto-generate tags, category, and a detailed summary
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><Sparkles className="w-4 h-4" />Capture</>}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
