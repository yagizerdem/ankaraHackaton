"use client";

import { usePathname, useRouter } from "next/navigation";

import type { GraphOption } from "@/app/student-panel/knowledge-graph/data";

/** Switches the page between the student's documents via `?graph=`. */
export function GraphSelect({
  graphs,
  selectedId,
}: {
  graphs: GraphOption[];
  selectedId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (graphs.length < 2) return null;

  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <label htmlFor="path-graph" className="text-label-md text-on-surface">
        Document
      </label>
      <select
        id="path-graph"
        value={selectedId}
        onChange={(event) =>
          router.push(`${pathname}?graph=${event.target.value}`, { scroll: false })
        }
        className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      >
        {graphs.map((graph) => (
          <option key={graph.id} value={graph.id}>
            {graph.documentName}
          </option>
        ))}
      </select>
    </div>
  );
}
