"use client";

import { useRef, useState } from "react";
import {
  CircleCheckIcon,
  CloudUploadIcon,
  FileUpIcon,
  LinkIcon,
  PlayCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadCenter } from "@/app/student-panel/dashboard/mockdata";
import { DocumentsTable } from "@/app/student-panel/dashboard/components/documents-table";

interface UploadCenterProps {
  onUpload: () => void;
}

export function UploadCenter({ onUpload }: UploadCenterProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <section
      aria-labelledby="upload-center-title"
      className="flex flex-col gap-4 rounded-xl bg-surface-container-low p-6 shadow-sm"
    >
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <FileUpIcon className="size-5 shrink-0 text-primary" />
            <h2
              id="upload-center-title"
              className="text-headline-md text-on-surface"
            >
              {uploadCenter.title}
            </h2>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            {uploadCenter.description}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg bg-surface-container-high px-4 py-1.5 text-label-md text-on-surface transition-colors hover:bg-surface-bright"
          >
            <LinkIcon className="size-4" />
            Import from URL
          </button>
          <button
            type="button"
            onClick={onUpload}
            className="flex items-center gap-1 rounded-lg bg-primary-container px-4 py-1.5 text-label-md text-on-primary-container shadow-sm transition-colors hover:bg-primary"
          >
            <PlayCircleIcon className="size-4" />
            Load Sample Calculus PDF
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files.length > 0) onUpload();
        }}
        className={cn(
          "group relative flex flex-col items-center justify-center rounded-xl p-6 text-center transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          dragging
            ? "bg-primary/10 ring-2 ring-primary ring-inset"
            : "bg-surface-container/60 hover:bg-surface-container",
        )}
      >
        <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-primary-container/20 text-primary transition-transform group-hover:scale-110 motion-reduce:transition-none">
          <CloudUploadIcon className="size-8" />
        </span>
        <span className="mb-1 text-title-md text-on-surface">
          {uploadCenter.dropTitle}
        </span>
        <span className="mb-2 max-w-xl text-body-sm text-on-surface-variant">
          {uploadCenter.dropHint}
        </span>
        <span className="flex flex-wrap items-center justify-center gap-2">
          {uploadCenter.capabilities.map((capability) => (
            <span
              key={capability.label}
              className={cn(
                "flex items-center gap-1 rounded bg-surface-container-high px-2 py-1 text-mono-data",
                capability.active ? "text-success" : "text-on-surface-variant",
              )}
            >
              {capability.active && <CircleCheckIcon className="size-3.5" />}
              {capability.label}
            </span>
          ))}
        </span>
      </button>
      <input
        ref={fileInput}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) onUpload();
          event.target.value = "";
        }}
      />

      <DocumentsTable />
    </section>
  );
}
