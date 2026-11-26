import Link from "next/link";
import { FileTextIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { GraphOption } from "@/app/student-panel/knowledge-graph/data";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

/** Every graph the student has, as links that switch the explorer. */
export function GraphPicker({
  options,
  selectedId,
}: {
  options: GraphOption[];
  selectedId: string;
}) {
  return (
    <nav aria-label="Your knowledge graphs">
      <ul className="flex gap-3 overflow-x-auto pb-1">
        {options.map((option) => {
          const active = option.id === selectedId;
          return (
            <li key={option.id} className="shrink-0">
              <Link
                href={`/student-panel/knowledge-graph?graph=${option.id}`}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={cn(
                  "flex w-60 items-start gap-2 rounded-xl border p-3 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-surface-container hover:bg-surface-container-high",
                )}
              >
                <FileTextIcon
                  aria-hidden
                  className={cn(
                    "mt-0.5 size-5 shrink-0",
                    active ? "text-primary" : "text-on-surface-variant",
                  )}
                />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-label-md text-on-surface">
                    {option.documentName}
                  </span>
                  <span className="text-mono-data text-on-surface-variant tabular-nums">
                    {option.topicCount} topics, {option.linkCount} links
                  </span>
                  <span className="text-mono-data text-outline">
                    {dateFormat.format(option.createdAt)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
