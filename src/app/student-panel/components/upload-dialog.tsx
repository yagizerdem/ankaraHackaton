"use client";

import { CircleCheckIcon, CircleDashedIcon, FilePlusIcon, FileTextIcon, RefreshCwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { pendingUpload } from "../mockdata";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const stepStyles = {
  done: { row: "text-success", icon: CircleCheckIcon, iconClass: "" },
  running: { row: "text-on-surface", icon: RefreshCwIcon, iconClass: "animate-spin text-tertiary motion-reduce:animate-none" },
  pending: { row: "text-outline", icon: CircleDashedIcon, iconClass: "" },
};

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 bg-surface-container-low p-6 sm:max-w-2xl">
        <div className="flex items-center gap-1 border-b border-surface-container-highest pb-2">
          <FilePlusIcon className="size-6 shrink-0 text-primary" />
          <div>
            <DialogTitle className="text-title-md text-on-surface">
              New Document Upload &amp; DAG Extraction
            </DialogTitle>
            <DialogDescription className="text-mono-data text-[11px] text-on-surface-variant">
              Gemini 1.5 Pro + Kahn Topological Verification
            </DialogDescription>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl bg-surface-container p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1">
              <FileTextIcon className="size-7 shrink-0 text-error" />
              <div className="min-w-0">
                <div className="truncate text-label-md font-semibold text-on-surface">
                  {pendingUpload.name}
                </div>
                <div className="text-mono-data text-[11px] text-on-surface-variant">
                  {pendingUpload.pages} Pages • {pendingUpload.size} • {pendingUpload.topic}
                </div>
              </div>
            </div>
            <span className="shrink-0 rounded bg-primary/20 px-1.5 py-0.5 text-mono-data text-[11px] text-primary">
              {pendingUpload.queueLabel}
            </span>
          </div>

          <ol className="flex flex-col gap-2 border-t border-surface-container-highest/60 pt-2 text-body-sm">
            {pendingUpload.steps.map((step) => {
              const style = stepStyles[step.state];
              const Icon = style.icon;
              return (
                <li key={step.label} className={cn("flex items-center justify-between gap-2", style.row)}>
                  <span className="flex items-center gap-1.5">
                    <Icon className={cn("size-4 shrink-0", style.iconClass)} />
                    {step.label}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-mono-data",
                      step.state === "running" && "text-tertiary",
                    )}
                  >
                    {step.detail}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <span className="text-body-sm text-on-surface-variant">
            Estimated time left: <strong className="text-on-surface">{pendingUpload.eta}</strong>
          </span>
          <div className="flex items-center gap-1">
            <DialogClose className="rounded-lg bg-surface-container px-4 py-1.5 text-label-md text-on-surface transition-colors hover:bg-surface-container-high">
              Cancel
            </DialogClose>
            <DialogClose className="rounded-lg bg-primary px-4 py-1.5 text-label-md text-on-primary shadow-sm transition-colors hover:bg-primary/90">
              Continue in Background
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
