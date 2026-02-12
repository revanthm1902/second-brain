"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      (document.getElementById("brain-search") as HTMLInputElement)?.focus();
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <motion.div layout className="relative w-full">
      <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-150 ${isFocused ? "text-accent" : "text-(--fg-muted)"}`} />
      <input
        id="brain-search"
        placeholder="Search your brain..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label="Search your brain. Press Ctrl+K to focus."
        role="searchbox"
        autoComplete="off"
        className={`w-full h-12 pl-11 pr-4 sm:pr-24 rounded-xl neo-border bg-white text-sm font-medium shadow-[3px_3px_0_#1a1a1a] transition-all duration-150 placeholder:text-(--fg-muted) placeholder:font-normal focus:outline-none ${isFocused ? "border-accent! -translate-x-px -translate-y-px shadow-[4px_4px_0_var(--accent)]" : ""}`}
      />
      <AnimatePresence>
        {!isFocused && !value && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none">
            <kbd className="inline-flex items-center gap-0.5 rounded-lg border-2 border-(--border) bg-background px-2 py-1 text-[10px] font-black text-(--fg-muted) shadow-[2px_2px_0_#1a1a1a]">
              <Command className="w-3 h-3" />K
            </kbd>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
