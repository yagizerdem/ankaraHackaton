import { FileTextIcon, NotebookPenIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { documents, type DocumentAction, type DocumentStatus } from "../mockdata";
import { ProgressBar } from "./progress-bar";

const actionStyles: Record<DocumentAction["variant"], string> = {
  neutral: "bg-surface-container-high text-on-surface hover:bg-surface-bright",
  primary: "bg-primary text-on-primary hover:bg-primary/90",
  success: "bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80",
  busy: "cursor-wait bg-surface-container-highest text-on-surface-variant",
};

export function DocumentsTable() {
  return (
    <div className="overflow-x-auto rounded-xl bg-surface-container">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="bg-surface-container-high text-label-sm text-on-surface-variant uppercase">
            <th scope="col" className="px-4 py-2">Document</th>
            <th scope="col" className="px-4 py-2">Pages</th>
            <th scope="col" className="px-4 py-2">Status / DAG Extraction</th>
            <th scope="col" className="px-4 py-2">Updated</th>
            <th scope="col" className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-container-highest/60 text-body-sm text-on-surface">
          {documents.map((document) => (
            <tr key={document.id} className="transition-colors hover:bg-surface-container-highest/40">
              <td className="px-4 py-2">
                <div className="flex items-center gap-1.5">
                  <FileTextIcon className="size-5 shrink-0 text-error" />
                  <div className="min-w-0">
                    <div className="truncate text-label-md text-on-surface">{document.name}</div>
                    <div className="text-mono-data text-[11px] text-on-surface-variant">
                      {document.source} • {document.size}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2 text-mono-data whitespace-nowrap">{document.pages} pages</td>
              <td className="px-4 py-2">
                <StatusCell status={document.status} />
              </td>
              <td className="px-4 py-2 text-mono-data whitespace-nowrap text-on-surface-variant">
                {document.time}
              </td>
              <td className="px-4 py-2">
                <div className="flex justify-end gap-1">
                  {document.actions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      disabled={action.variant === "busy"}
                      className={cn(
                        "rounded px-2 py-1 text-label-sm whitespace-nowrap transition-colors",
                        actionStyles[action.variant],
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusCell({ status }: { status: DocumentStatus }) {
  switch (status.kind) {
    case "done":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-0.5 text-label-sm text-success">
          <span className="size-1.5 rounded-full bg-success" />
          {status.label}
        </span>
      );
    case "processing":
      return (
        <div className="flex w-48 flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-mono-data text-[11px] text-tertiary">
            <span>{status.label}</span>
            <span>{status.percent}%</span>
          </div>
          <ProgressBar
            percent={status.percent}
            barClassName="bg-tertiary"
            size="sm"
            pulse
            label={status.label}
          />
        </div>
      );
    case "draft":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-2 py-0.5 text-label-sm text-on-surface-variant">
          <NotebookPenIcon className="size-3.5 shrink-0" />
          {status.label}
        </span>
      );
  }
}
