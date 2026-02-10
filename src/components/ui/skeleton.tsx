"use client";

import { cn } from "@/app/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl skeleton-shimmer", className)}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 bg-white rounded-2xl neo-border shadow-[4px_4px_0_#1a1a1a] space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-7 w-18 rounded-full" />
        <Skeleton className="h-7 w-14 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export { Skeleton };
