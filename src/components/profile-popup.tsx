"use client";

import { LogOut, X, User, Zap } from "lucide-react";
import { signOut } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";

interface ProfilePopupProps {
  open: boolean;
  onClose: () => void;
  userEmail?: string;
  captureCount: number;
}

export function ProfilePopup({ open, onClose, userEmail, captureCount }: ProfilePopupProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 24, stiffness: 400 }}
            className="fixed top-19 right-5 z-50 w-72"
          >
            <div className="bg-white neo-border rounded-2xl shadow-[6px_6px_0_#1a1a1a] overflow-hidden">
              <div className="h-1.5 bg-purple" />

              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm tracking-tight text-foreground">Profile</span>
                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-lg neo-border bg-white flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-all duration-150 cursor-pointer shadow-[2px_2px_0_#1a1a1a] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#1a1a1a]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* User info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background neo-border shadow-[2px_2px_0_#1a1a1a]">
                  <div className="w-10 h-10 rounded-xl bg-purple neo-border flex items-center justify-center shadow-[2px_2px_0_#1a1a1a]">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-foreground truncate">{userEmail || "User"}</p>
                    <p className="text-[10px] font-bold text-(--fg-muted) uppercase tracking-wider">Pro Brain</p>
                  </div>
                </div>

                {/* Captures */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border-2 border-accent/30">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold text-foreground">Total Captures</span>
                  </div>
                  <span className="text-sm font-black text-accent bg-white rounded-lg px-2.5 py-1 border-2 border-accent/30 shadow-[2px_2px_0_var(--accent)]">
                    {captureCount}
                  </span>
                </div>

                {/* Sign out */}
                <button
                  onClick={() => signOut().then(() => (window.location.href = "/login"))}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border-2 border-red-300 shadow-[2px_2px_0_#ef4444] hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#ef4444] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_#ef4444] transition-all duration-150 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
