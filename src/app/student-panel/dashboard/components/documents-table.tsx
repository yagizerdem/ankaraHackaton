import Link from "next/link";
import { FileTextIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { UploadRow } from "@/app/student-panel/uploads/data";

/** How many documents the dashboard lists; the rest are on the uploads page. */
const LIMIT = 5;

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

const fileIconClass: Record<string, string> = {
  pdf: "text-error",
  docx: "text-primary",
  doc: "text-primary",
  txt: "text-on-surface-variant",
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Status({ row }: { row: UploadRow }) {
  const [label, className] = row.graph
    ? [`Graph ready: ${row.graph.topics} topics, ${row.graph.edges} links`, "bg-success/15 text-success"]
    : row.chunkCount > 0
      ? [`${row.chunkCount} chunks embedded, graph pending`, "bg-tertiary/15 text-tertiary"]
      : ["Uploaded, not processed", "bg-surface-container-highest text-on-surface-variant"];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-label-sm whitespace-nowrap",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

const actionClass =
  "rounded px-2 py-1 text-label-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function DocumentsTable({
  rows,
  graphIdByDocument,
}: {
  rows: UploadRow[];
  /** Graph id for each document that has one, for the action links. */
  graphIdByDocument: Map<string, string>;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl bg-surface-container px-4 py-6 text-center text-body-sm text-on-surface-variant">
        No documents yet. Your uploads will be listed here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* relative: clips the absolutely positioned sr-only header text too. */}
      <div className="relative overflow-x-auto rounded-xl bg-surface-container">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <caption className="sr-only">Your latest documents</caption>
          <thead>
            <tr className="bg-surface-container-high text-label-md text-on-surface-variant">
              <th scope="col" className="px-4 py-2 font-medium">Document</th>
              <th scope="col" className="px-4 py-2 font-medium">Pages</th>
              <th scope="col" className="px-4 py-2 font-medium">Status</th>
              <th scope="col" className="px-4 py-2 font-medium">Uploaded</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-highest/60 text-body-sm text-on-surface">
            {rows.slice(0, LIMIT).map((row) => {
              const graphId = graphIdByDocument.get(row.id);
              return (
                <tr key={row.id} className="transition-colors hover:bg-surface-container-highest/40">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <FileTextIcon
                        aria-hidden
                        className={cn(
                          "size-5 shrink-0",
                          fileIconClass[row.extension] ?? "text-on-surface-variant",
                        )}
                      />
                      <div className="min-w-0">
                        <div className="max-w-64 truncate text-label-md text-on-surface">
                          {row.name}
                        </div>
                        <div className="text-mono-data text-[11px] text-on-surface-variant uppercase">
                          {row.extension} · {formatSize(row.size)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-mono-data whitespace-nowrap tabular-nums">
                    {row.pageCount ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Status row={row} />
                  </td>
                  <td className="px-4 py-2 text-mono-data whitespace-nowrap text-on-surface-variant">
                    <time dateTime={row.createdAt.toISOString()}>
                      {dateFormat.format(row.createdAt)}
                    </time>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      {graphId ? (
                        <>
                          <Link
                            href={`/student-panel/knowledge-graph?graph=${graphId}`}
                            className={cn(actionClass, "bg-surface-container-high text-on-surface hover:bg-surface-bright")}
                          >
                            View graph
                          </Link>
                          <Link
                            href={`/student-panel/assessment?graph=${graphId}`}
                            className={cn(actionClass, "bg-primary text-on-primary hover:bg-primary/90")}
                          >
                            Start exam
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/student-panel/uploads"
                          className={cn(actionClass, "bg-surface-container-high text-on-surface hover:bg-surface-bright")}
                        >
                          Manage
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > LIMIT && (
        <Link
          href="/student-panel/uploads"
          className="self-end rounded text-label-md text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary"
        >
          See all {rows.length} documents
        </Link>
      )}
    </div>
  );
}
