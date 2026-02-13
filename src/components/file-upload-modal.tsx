"use client";

import { useState, useRef } from "react";
import { uploadFile } from "@/app/actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Check, FileText, File, X, Sparkles, Tag, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const ACCEPTED_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "application/json",
  "application/pdf",
  "application/xml",
];

const ACCEPTED_EXTENSIONS = [".txt", ".md", ".csv", ".json", ".pdf", ".xml", ".html", ".log", ".yml", ".yaml"];

export function FileUploadModal({ open, onOpenChange, onCreated }: FileUploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiResult, setAiResult] = useState<{ summary: string; tags: string[]; category: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function isAcceptedFile(file: File): boolean {
    if (ACCEPTED_TYPES.includes(file.type)) return true;
    return ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && isAcceptedFile(file)) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError("Unsupported file type. Try .txt, .md, .csv, .json, or .pdf");
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (isAcceptedFile(file)) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError("Unsupported file type");
      }
    }
  }

  async function handleUpload() {
    if (!selectedFile || loading) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("file", selectedFile);

      const result = await uploadFile(formData);
      if (result.success && result.item) {
        setAiResult({
          summary: result.item.ai_summary || "",
          tags: result.item.ai_tags || [],
          category: result.item.ai_category || "Learning",
        });
        setTimeout(() => {
          onOpenChange(false);
          setAiResult(null);
          setSelectedFile(null);
          onCreated();
        }, 3000);
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Body exceeded") || message.includes("body size")) {
        setError("File is too large for processing. Please use a smaller file (under 5MB).");
      } else {
        setError(message || "An unexpected error occurred. Please try again.");
      }
    }
    setLoading(false);
  }

  function handleClear() {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSelectedFile(null); setAiResult(null); setError(null); } }}>
      <DialogContent className="sm:max-w-130" aria-label="Upload a document to your brain">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neo-green neo-border rounded-xl shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block">Upload Document</span>
              <span className="block text-[10px] font-bold text-(--fg-muted) uppercase tracking-widest">Second Brain</span>
            </div>
          </DialogTitle>
          <DialogDescription>Upload text files, markdown, CSV, JSON, or PDFs. AI will extract and analyze the content.</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {aiResult ? (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="py-8 text-center space-y-5">
              <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }} className="w-18 h-18 bg-neo-green neo-border rounded-2xl flex items-center justify-center mx-auto shadow-[4px_4px_0_#1a1a1a]">
                <Check className="w-8 h-8 text-white" strokeWidth={3} />
              </motion.div>
              <div>
                <h3 className="font-black text-lg text-foreground mb-2">Uploaded & Analyzed!</h3>
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
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 pt-2">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Click or drag and drop a file to upload"
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
                className={`relative flex flex-col items-center justify-center p-10 rounded-2xl border-3 border-dashed transition-all duration-200 cursor-pointer ${
                  dragOver
                    ? "border-accent bg-accent/10 scale-[1.02]"
                    : selectedFile
                    ? "border-neo-green bg-neo-green/5"
                    : "border-(--border) bg-background hover:border-accent hover:bg-accent/5"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS.join(",")}
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-hidden="true"
                />

                {selectedFile ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-neo-green/20 neo-border rounded-xl flex items-center justify-center shadow-[2px_2px_0_#1a1a1a]">
                      <FileText className="w-6 h-6 text-neo-green" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-foreground">{selectedFile.name}</p>
                      <p className="text-xs font-bold text-(--fg-muted)">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleClear(); }}
                      className="w-8 h-8 rounded-lg border-2 border-(--border) bg-white flex items-center justify-center shadow-[2px_2px_0_#1a1a1a] hover:bg-red-100 transition-all cursor-pointer"
                      aria-label="Remove selected file"
                    >
                      <X className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className={`w-10 h-10 mb-3 ${dragOver ? "text-accent" : "text-(--fg-muted)"}`} />
                    <p className="text-sm font-bold text-foreground mb-1">Drop a file here or click to browse</p>
                    <p className="text-xs font-medium text-(--fg-muted)">.txt, .md, .csv, .json, .pdf — max 5MB</p>
                  </>
                )}
              </div>

              {error && (
                <div className="text-xs font-bold text-red-600 bg-red-50 rounded-xl px-4 py-3 border-2 border-red-200" role="alert">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs font-bold text-(--fg-muted) bg-accent/5 rounded-xl px-4 py-3 border-2 border-accent/20">
                <Sparkles className="w-4 h-4 text-accent shrink-0" />
                AI will extract text, generate tags, category, and a summary
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={loading || !selectedFile}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</> : <><Upload className="w-4 h-4" />Upload & Analyze</>}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
