"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl neo-border bg-white px-4 py-2.5 text-sm font-medium shadow-[3px_3px_0_#1a1a1a] transition-all duration-150 placeholder:text-(--fg-muted) placeholder:font-normal focus-visible:outline-none focus-visible:-translate-x-px focus-visible:-translate-y-px focus-visible:shadow-[4px_4px_0_var(--accent)] focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
