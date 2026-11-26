"use client";

import { Fragment, useRef, useState } from "react";
import {
  BinaryIcon,
  CheckIcon,
  CloudUploadIcon,
  FileCheckIcon,
  FilePlusIcon,
  FileTextIcon,
  FileXIcon,
  NetworkIcon,
  ScissorsIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UPLOAD_STEPS,
  useUpload,
  type UploadStep,
} from "@/providers/upload-provider";
import { Button } from "@base-ui/react";
import { toast } from "sonner";

const STAGES: {
  step: Exclude<UploadStep, "done">;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    step: "upload",
    title: "Upload",
    description: "Saving the file to your library",
    icon: CloudUploadIcon,
  },
  {
    step: "chunking",
    title: "Chunking",
    description: "Splitting the text into overlapping passages",
    icon: ScissorsIcon,
  },
  {
    step: "embedding",
    title: "Embedding",
    description: "Turning each passage into a vector for search",
    icon: BinaryIcon,
  },
  {
    step: "dag",
    title: "DAG",
    description: "Mapping topics and the prerequisites between them",
    icon: NetworkIcon,
  },
];

const ACCEPTED_EXTENSIONS = ["pdf", "doc", "docx", "txt"];
const MAX_PAGES = 50;

export function UploadDialog() {
  const {
    showUploadModal,
    setShowUploadModal,
    uploadFile,
    currentStep,
    setCurrentStep,
    generateEmbeddings,
  } = useUpload();
  // Position of the running stage; past the last stage once all are done.
  const currentIndex =
    currentStep === "done"
      ? UPLOAD_STEPS.length
      : UPLOAD_STEPS.indexOf(currentStep);
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null | undefined>();
  const [pageError, setPageError] = useState<string | null>(null);
  const latestFile = useRef<File | null>(null);
  const [chunkCount, setChunkCount] = useState<number | null>(null);

  async function chooseFile(next: File | undefined) {
    if (!next) return;
    latestFile.current = next;
    setFile(next);
    setPageCount(undefined);
    setPageError(null);
    setChunkCount(null);

    try {
      const { getPageCount } = await import("@/lib/document/page-count");
      const extension = next.name.split(".").pop()?.toLowerCase() ?? "";
      const count = await getPageCount(
        new Uint8Array(await next.arrayBuffer()),
        extension,
      );
      if (latestFile.current === next) setPageCount(count);
    } catch {
      if (latestFile.current !== next) return;
      setPageCount(null);
      setPageError("Couldn't read this file; it may be corrupted");
    }
  }

  function clearFile() {
    latestFile.current = null;
    setFile(null);
    setPageCount(undefined);
    setPageError(null);
    setChunkCount(null);
  }

  const tooManyPages = pageCount != null && pageCount > MAX_PAGES;

  async function startProcess() {
    if (!file) {
      toast.error("No file selected");
      return;
    }

    // 1.  upload the file
    const uploadResponse = await uploadFile(file);
    if (!uploadResponse.isSuccess) {
      toast.error(uploadResponse.message ?? "Upload failed");
      return;
    }
    const uploadId = uploadResponse.data?.id;
    if (!uploadId) {
      toast.error("Upload failed");
      return;
    }
    toast.success("Upload successful");
    setCurrentStep("chunking");
    // 2. generate embedddings of the uploaded document

    const embeddingResponse = await generateEmbeddings(uploadId);
    if (!embeddingResponse.isSuccess) {
      toast.error(embeddingResponse.message ?? "Embedding failed");
      return;
    }

    setChunkCount(embeddingResponse.data?.chunkCount ?? null);

    toast.success("Embeddings generated successfully");
    setCurrentStep("dag");
  }

  return (
    <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
      <DialogContent className="gap-0 overflow-hidden bg-surface-container-low p-0 ring-white/8 sm:max-w-lg">
        <header className="flex items-start gap-3 border-b border-surface-container-highest px-6 pt-5 pb-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FilePlusIcon className="size-5" />
          </span>
          <div className="min-w-0 pr-6">
            <DialogTitle className="text-title-md text-on-surface">
              Upload a document
            </DialogTitle>
            <DialogDescription className="text-body-sm text-on-surface-variant">
              We&apos;ll map its topics and the prerequisites between them.
            </DialogDescription>
          </div>
        </header>

        <div className="flex flex-col gap-3 border-b border-surface-container-highest px-6 py-5">
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
              chooseFile(event.dataTransfer.files[0]);
            }}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-6 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
              dragging
                ? "border-primary bg-primary/10"
                : file && (pageError || tooManyPages)
                  ? "border-error/50 bg-error/5 hover:bg-error/10"
                  : file
                    ? "border-success/50 bg-success/5 hover:bg-success/10"
                    : "border-outline-variant bg-surface-container-lowest hover:border-primary/60 hover:bg-surface-container",
            )}
          >
            {!file && (
              <Fragment>
                <CloudUploadIcon
                  className={cn(
                    "size-7 transition-colors",
                    dragging ? "text-primary" : "text-on-surface-variant",
                  )}
                />
                <span className="text-label-md text-on-surface">
                  {dragging
                    ? "Drop to add it"
                    : "Drag a file here or click to browse"}
                </span>
                <span className="text-body-sm text-on-surface-variant">
                  PDF, DOC, DOCX or TXT, up to {MAX_PAGES} pages
                </span>
              </Fragment>
            )}
            {file && (
              <Fragment>
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    pageError || tooManyPages
                      ? "bg-error/15 text-error"
                      : "bg-success/15 text-success",
                  )}
                >
                  {pageError || tooManyPages ? (
                    <FileXIcon className="size-5" />
                  ) : (
                    <FileCheckIcon className="size-5" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-label-md",
                    pageError || tooManyPages ? "text-error" : "text-success",
                  )}
                >
                  {pageError || tooManyPages
                    ? "File can't be used"
                    : "File imported"}
                </span>
                <span className="text-body-sm text-on-surface-variant">
                  Click or drop another file to replace it
                </span>
              </Fragment>
            )}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(",")}
            className="hidden"
            onChange={(event) => {
              chooseFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />

          {file && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg border bg-surface-container px-3 py-2",
                pageError || tooManyPages
                  ? "border-error/40"
                  : "border-white/8",
              )}
            >
              <FileTextIcon
                className={cn(
                  "size-5 shrink-0",
                  pageError || tooManyPages ? "text-error" : "text-primary",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-label-md text-on-surface">
                  {file.name}
                </p>
                <p
                  role={pageError || tooManyPages ? "alert" : undefined}
                  aria-live="polite"
                  className={cn(
                    "text-body-sm tabular-nums",
                    pageError || tooManyPages
                      ? "text-error"
                      : "text-on-surface-variant",
                  )}
                >
                  {pageError ??
                    (pageCount === undefined
                      ? "Counting pages..."
                      : pageCount === null
                        ? "Page count not available for this format"
                        : tooManyPages
                          ? `${pageCount} pages; the limit is ${MAX_PAGES}`
                          : `${pageCount} ${pageCount === 1 ? "page" : "pages"}`)}
                </p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                aria-label={`Remove ${file.name}`}
                className="rounded-md p-1 text-on-surface-variant transition-colors outline-none hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          )}
        </div>

        <ol className="flex flex-col px-6 py-5" aria-label="Processing steps">
          {STAGES.map((stage, index) => {
            const done = index < currentIndex;
            const active = index === currentIndex;
            const isLast = index === STAGES.length - 1;
            const Icon = done ? CheckIcon : stage.icon;

            return (
              <li
                key={stage.step}
                aria-current={active ? "step" : undefined}
                className="relative grid grid-cols-[2.25rem_1fr_auto] gap-x-3 pb-5 last:pb-0"
              >
                {!isLast && (
                  <span
                    aria-hidden
                    className="absolute top-10 bottom-1 left-[1.0625rem] w-0.5 overflow-hidden rounded-full bg-surface-container-highest"
                  >
                    <span
                      className={cn(
                        "block h-full origin-top bg-success transition-transform duration-500 ease-out motion-reduce:transition-none",
                        done ? "scale-y-100" : "scale-y-0",
                      )}
                    />
                  </span>
                )}

                <span
                  className={cn(
                    "flex size-9 items-center justify-center transition-colors duration-300",
                    isLast ? "rounded-full" : "rounded-lg",
                    done && "bg-success/15 text-success",
                    active &&
                      "bg-primary/15 text-primary shadow-[0_0_12px_rgba(99,102,241,0.35)] ring-1 ring-primary",
                    !done &&
                      !active &&
                      "bg-surface-container-high text-outline",
                  )}
                >
                  <Icon className="size-4" />
                </span>

                <div className="min-w-0 pt-0.5">
                  <p
                    className={cn(
                      "text-label-md",
                      done || active
                        ? "text-on-surface"
                        : "text-on-surface-variant",
                    )}
                  >
                    {stage.title}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">
                    {stage.description}
                  </p>
                  {chunkCount != null &&
                    (stage.step === "chunking" ||
                      stage.step === "embedding") && (
                      <p
                        aria-live="polite"
                        className="mt-0.5 text-mono-data text-success tabular-nums"
                      >
                        {stage.step === "chunking"
                          ? `${chunkCount} ${chunkCount === 1 ? "chunk" : "chunks"} created`
                          : `${chunkCount} ${chunkCount === 1 ? "vector" : "vectors"} generated`}
                      </p>
                    )}
                </div>

                <span
                  className={cn(
                    "pt-0.5 text-mono-data",
                    done && "text-success",
                    active && "text-primary",
                    !done && !active && "text-outline",
                  )}
                >
                  {done ? "Done" : active ? "In progress" : "Waiting"}
                </span>
              </li>
            );
          })}
        </ol>

        <footer className="flex items-center justify-end gap-2 border-t border-surface-container-highest px-6 py-3">
          <Button
            onMouseUp={startProcess}
            className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-surface-bright px-4 py-1.5 text-label-md text-on-surface transition-colors outline-none hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary"
          >
            Start process
          </Button>

          <DialogClose className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-surface-container px-4 py-1.5 text-label-md text-on-surface transition-colors outline-none hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary">
            Close
          </DialogClose>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
