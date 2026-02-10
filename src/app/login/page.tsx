"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (signUpError) setError(signUpError.message);
      else setMessage("Check your email for the confirmation link.");
      setLoading(false);
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
      } else {
        setLoading(false);
        setTransitioning(true);
        setTimeout(() => { window.location.href = "/"; }, 800);
      }
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        animate={transitioning ? { y: "-100vh", opacity: 0 } : { y: 0, opacity: 1 }}
        transition={transitioning ? { duration: 0.7, ease: [0.65, 0, 0.35, 1] } : {}}
        className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background"
      >
        {/* Ruled paper background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[#f8f4e8]" />
          <div className="absolute top-0 bottom-0 left-20 w-0.5 bg-[#e8bfbf]/60" />
          <div className="absolute top-0 bottom-0 left-21 w-px bg-[#e8bfbf]/40" />
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ruled-lines" x="0" y="0" width="100%" height="32" patternUnits="userSpaceOnUse">
                <line x1="0" y1="31" x2="100%" y2="31" stroke="#c8d4e8" strokeWidth="1" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ruled-lines)" />
          </svg>
          <div className="absolute left-7 top-[15%] w-5 h-5 rounded-full border-2 border-[#d0c8b8]/40 bg-[#e8e0d0]/30" />
          <div className="absolute left-7 top-1/2 w-5 h-5 rounded-full border-2 border-[#d0c8b8]/40 bg-[#e8e0d0]/30" />
          <div className="absolute left-7 top-[85%] w-5 h-5 rounded-full border-2 border-[#d0c8b8]/40 bg-[#e8e0d0]/30" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={transitioning ? { opacity: 0, scale: 0.9 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <div className="bg-white neo-border rounded-3xl shadow-[8px_8px_0_#1a1a1a] p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-accent" />

            {/* Logo */}
            <div className="flex flex-col items-center mb-8 pt-2">
              <div className="w-20 h-20 bg-accent neo-border rounded-2xl flex items-center justify-center shadow-[4px_4px_0_#1a1a1a] mb-4">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">Second Brain</h1>
              <div className="flex items-center gap-1.5 mt-2 bg-accent/10 text-accent font-bold text-xs uppercase tracking-widest px-3 py-1.5 rounded-lg border-2 border-accent/30">
                <Sparkles className="w-3.5 h-3.5" />
                AI-powered knowledge system
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm font-bold text-red-600 bg-red-50 rounded-xl px-4 py-3 border-2 border-red-300 shadow-[2px_2px_0_#ef4444]">
                  {error}
                </motion.div>
              )}
              {message && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm font-bold text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 border-2 border-emerald-300 shadow-[2px_2px_0_#22c55e]">
                  {message}
                </motion.div>
              )}

              <Button type="submit" className="w-full h-13 text-base" size="lg" disabled={loading || transitioning}>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : transitioning ? (
                  <><Sparkles className="w-5 h-5 animate-pulse" /> Entering your brain...</>
                ) : (
                  <>{isSignUp ? "Create Account" : "Sign In"} <ArrowRight className="w-5 h-5" /></>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
                className="text-sm font-bold text-(--fg-muted) hover:text-accent transition-colors cursor-pointer underline underline-offset-4 decoration-2 decoration-(--fg-muted)/30 hover:decoration-accent"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mt-6">
            {["🧠 Ideas", "🔗 Links", "💡 Insights", "✨ AI"].map((label) => (
              <span key={label} className="text-xs font-bold text-(--fg-muted) bg-white border-2 border-(--border) rounded-lg px-3 py-1.5 shadow-[2px_2px_0_#1a1a1a]">
                {label}
              </span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
