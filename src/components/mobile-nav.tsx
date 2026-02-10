"use client";

import { Brain, FileText, Link2, Lightbulb, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { signOut } from "@/app/actions";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "All", icon: Brain, value: "all" },
  { label: "Notes", icon: FileText, value: "note" },
  { label: "Links", icon: Link2, value: "link" },
  { label: "Insights", icon: Lightbulb, value: "insight" },
];

interface MobileNavProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function MobileNav({ activeFilter, onFilterChange }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 z-40 overflow-hidden"
          >
            <div className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    onClick={() => {
                      onFilterChange(item.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer",
                      activeFilter === item.value
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
              <hr className="my-2 border-slate-100" />
              <button
                onClick={() =>
                  signOut().then(() => (window.location.href = "/login"))
                }
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
