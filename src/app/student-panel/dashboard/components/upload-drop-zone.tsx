"use client";

import { CloudUploadIcon } from "lucide-react";

import { useUpload } from "@/providers/upload-provider";

/**
 * Opens the upload pipeline dialog. The dialog itself is rendered once by
 * UploadButton, which also refreshes the page as stages finish.
 */
export function UploadDropZone() {
  const { setShowUploadModal } = useUpload();

  return (
    <button
      type="button"
      onClick={() => setShowUploadModal(true)}
      onDragOver={(event) => {
        event.preventDefault();
        setShowUploadModal(true);
      }}
      className="group flex flex-col items-center justify-center rounded-xl bg-surface-container/60 p-6 text-center transition-colors duration-300 outline-none hover:bg-surface-container focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-primary-container/20 text-primary transition-transform group-hover:scale-110 motion-reduce:transition-none">
        <CloudUploadIcon aria-hidden className="size-8" />
      </span>
      <span className="mb-1 text-title-md text-on-surface">
        Add a textbook chapter, lecture notes or slides
      </span>
      <span className="max-w-xl text-body-sm text-on-surface-variant">
        PDF, DOCX or TXT, up to 50 pages. It&apos;s split into chunks, embedded
        for search, and turned into a prerequisite graph.
      </span>
    </button>
  );
}
