"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-30 w-full rounded-xl neo-border bg-white px-4 py-3 text-sm font-medium shadow-[3px_3px_0_#1a1a1a] transition-all duration-150 placeholder:text-(--fg-muted) placeholder:font-normal focus-visible:outline-none focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-[4px_4px_0_var(--accent)] focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
