import { FileTextIcon, FileUpIcon } from "lucide-react";

import { DeleteDocumentButton } from "@/app/student-panel/uploads/components/delete-document-button";
import { cn } from "@/lib/utils";

import type { UploadRow } from "@/app/student-panel/uploads/data";

// Same stages, in the same order, as the upload dialog.
const PIPELINE = ["Upload", "Chunking", "Embedding", "DAG"] as const;

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

/** How many pipeline stages a document has finished, 1-4. */
function finishedStages(row: UploadRow) {
  if (row.graph) return 4;
  if (row.chunkCount > 0) return 3;
  return 1;
}

function Status({ row }: { row: UploadRow }) {
  const [label, className] = row.graph
    ? ["Graph ready", "bg-success/15 text-success"]
    : row.chunkCount > 0
      ? ["Graph pending", "bg-tertiary/15 text-tertiary"]
      : ["Not processed", "bg-surface-container-highest text-on-surface-variant"];

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-label-sm whitespace-nowrap",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function Pipeline({ row }: { row: UploadRow }) {
  const finished = finishedStages(row);

  return (
    <ol
      aria-label={`${finished} of ${PIPELINE.length} stages finished`}
      className="flex items-center gap-1"
    >
      {PIPELINE.map((stage, index) => (
        <li key={stage} className="flex items-center gap-1">
          <span
            title={stage}
            className={cn(
              "h-1.5 w-6 rounded-full",
              index < finished ? "bg-success" : "bg-surface-container-highest",
            )}
          />
        </li>
      ))}
    </ol>
  );
}

export function UploadsStats({ rows }: { rows: UploadRow[] }) {
  const stats = [
    { label: "Documents", value: rows.length },
    {
      label: "Pages",
      value: rows.reduce((sum, row) => sum + (row.pageCount ?? 0), 0),
    },
    {
      label: "Chunks embedded",
      value: rows.reduce((sum, row) => sum + row.chunkCount, 0),
    },
    {
      label: "Topics mapped",
      value: rows.reduce((sum, row) => sum + (row.graph?.topics ?? 0), 0),
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col gap-1 rounded-xl bg-surface-container p-4"
        >
          <dt className="text-label-md text-on-surface-variant">{stat.label}</dt>
          <dd className="text-headline-lg text-on-surface tabular-nums">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function UploadsList({ rows }: { rows: UploadRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 text-center">
        <FileUpIcon className="size-7 text-on-surface-variant" />
        <p className="text-title-md text-on-surface">No documents yet</p>
        <p className="max-w-sm text-body-sm text-on-surface-variant">
          Upload a PDF, DOCX or TXT and LearnGraph will map its topics and the
          prerequisites between them.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-surface-container">
      <table className="w-full min-w-[800px] border-collapse text-left">
        <caption className="sr-only">Your uploaded documents</caption>
        <thead>
          <tr className="bg-surface-container-high text-label-md text-on-surface-variant">
            <th scope="col" className="px-4 py-2 font-medium">Document</th>
            <th scope="col" className="px-4 py-2 font-medium">Pages</th>
            <th scope="col" className="px-4 py-2 font-medium">Pipeline</th>
            <th scope="col" className="px-4 py-2 font-medium">Chunks</th>
            <th scope="col" className="px-4 py-2 font-medium">Graph</th>
            <th scope="col" className="px-4 py-2 font-medium">Uploaded</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container-highest/60 text-body-sm text-on-surface">
          {rows.map((row) => (
            <tr
              key={row.id}
              className="transition-colors hover:bg-surface-container-highest/40"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileTextIcon
                    className={cn(
                      "size-5 shrink-0",
                      fileIconClass[row.extension] ?? "text-on-surface-variant",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="max-w-64 truncate text-label-md text-on-surface">
                      {row.name}
                    </div>
                    <div className="text-mono-data text-on-surface-variant uppercase">
                      {row.extension} · {formatSize(row.size)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-mono-data whitespace-nowrap tabular-nums">
                {row.pageCount ?? "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1.5">
                  <Pipeline row={row} />
                  <Status row={row} />
                </div>
              </td>
              <td className="px-4 py-3 text-mono-data tabular-nums">
                {row.chunkCount || "—"}
              </td>
              <td className="px-4 py-3 text-mono-data whitespace-nowrap tabular-nums">
                {row.graph
                  ? `${row.graph.topics} topics, ${row.graph.edges} links`
                  : "—"}
              </td>
              <td className="px-4 py-3 text-mono-data whitespace-nowrap text-on-surface-variant">
                <time dateTime={row.createdAt.toISOString()}>
                  {dateFormat.format(row.createdAt)}
                </time>
              </td>
              <td className="px-4 py-3 text-right">
                <DeleteDocumentButton
                  documentId={row.id}
                  documentName={row.name}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
