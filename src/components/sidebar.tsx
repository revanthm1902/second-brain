"use client";

import { Brain, FileText, Link2, Lightbulb, LogOut, Sparkles } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { signOut } from "@/app/actions";
import { motion } from "framer-motion";

const navItems = [
  { label: "All Items", icon: Brain, value: "all" },
  { label: "Notes", icon: FileText, value: "note" },
  { label: "Links", icon: Link2, value: "link" },
  { label: "Insights", icon: Lightbulb, value: "insight" },
];

interface SidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  itemCounts: Record<string, number>;
}

export function Sidebar({ activeFilter, onFilterChange, itemCounts }: SidebarProps) {
  return (
    <aside className="w-72 shrink-0 border-r border-white/10 bg-white/40 backdrop-blur-2xl hidden md:flex flex-col">
      {/* Brand */}
      <div className="p-6 pb-4">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900">
              Second Brain
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI-powered
            </p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-2">
          Categories
        </p>
        <div className="space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeFilter === item.value;
            const count = item.value === "all"
              ? itemCounts.all || 0
              : itemCounts[item.value] || 0;

            return (
              <motion.button
                key={item.value}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
                onClick={() => onFilterChange(item.value)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span className="flex-1 text-left">{item.label}</span>
                <span
                  className={cn(
                    "text-xs tabular-nums rounded-full px-2 py-0.5 transition-colors",
                    isActive
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-slate-100 text-slate-400"
                  )}
                >
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => signOut().then(() => (window.location.href = "/login"))}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
