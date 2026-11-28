"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Re-renders the server list so it picks up pipeline progress. */
export function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isRefreshing}
      aria-busy={isRefreshing}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 text-label-md text-on-surface transition-colors outline-none hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
    >
      <RefreshCwIcon
        aria-hidden
        className={cn(
          "size-4",
          isRefreshing && "animate-spin motion-reduce:animate-none",
        )}
      />
      {isRefreshing ? "Refreshing..." : "Refresh"}
    </button>
  );
}
