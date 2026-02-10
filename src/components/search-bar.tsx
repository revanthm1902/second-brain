"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Command } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.getElementById("brain-search") as HTMLInputElement;
        input?.focus();
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <motion.div
      layout
      className="relative w-full max-w-xl"
    >
      <Search
        className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
          isFocused ? "text-indigo-500" : "text-slate-400"
        }`}
      />
      <Input
        id="brain-search"
        placeholder="Search your brain..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="pl-11 pr-24 h-12 rounded-2xl bg-white/60 backdrop-blur-xl border-slate-200/80 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-400 shadow-sm hover:shadow-md transition-shadow"
      />
      <AnimatePresence>
        {!isFocused && !value && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none"
          >
            <kbd className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-400 shadow-sm">
              <Command className="w-3 h-3" />K
            </kbd>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
