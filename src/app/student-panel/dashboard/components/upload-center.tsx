import { FileUpIcon } from "lucide-react";

import { DocumentsTable } from "@/app/student-panel/dashboard/components/documents-table";
import { UploadDropZone } from "@/app/student-panel/dashboard/components/upload-drop-zone";
import { UploadButton } from "@/app/student-panel/uploads/components/upload-button";

import type { DashboardData } from "@/app/student-panel/dashboard/data";

export function UploadCenter({ data }: { data: DashboardData }) {
  const graphIdByDocument = new Map(
    data.graphs.map((option) => [option.documentId, option.id]),
  );

  return (
    <section
      aria-labelledby="upload-center-title"
      className="flex flex-col gap-4 rounded-xl bg-surface-container-low p-6 shadow-sm"
    >
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <FileUpIcon aria-hidden className="size-5 shrink-0 text-primary" />
            <h2 id="upload-center-title" className="text-headline-md text-on-surface">
              Documents
            </h2>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            Gemini extracts the topics and their prerequisites, and the graph is
            checked to be acyclic with Kahn&apos;s algorithm.
          </p>
        </div>
        {/* Renders the upload dialog the drop zone opens, too. */}
        <UploadButton />
      </div>

      <UploadDropZone />
      <DocumentsTable rows={data.uploads} graphIdByDocument={graphIdByDocument} />
    </section>
  );
}
