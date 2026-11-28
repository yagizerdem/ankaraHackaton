"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";

import { UploadDialog } from "@/app/student-panel/dashboard/components/upload-dialog";
import { useUpload } from "@/providers/upload-provider";

/** Opens the upload pipeline dialog and refreshes the list as stages finish. */
export function UploadButton() {
  const router = useRouter();
  const { setShowUploadModal, currentStep } = useUpload();
  const previousStep = useRef(currentStep);

  // Each finished stage changes what the server list shows (new row, chunk
  // count, graph), so re-render the server component when the step advances.
  useEffect(() => {
    if (previousStep.current !== currentStep && currentStep !== "upload") {
      router.refresh();
    }
    previousStep.current = currentStep;
  }, [currentStep, router]);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowUploadModal(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary shadow-sm transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <PlusIcon className="size-4" />
        Upload document
      </button>
      <UploadDialog />
    </>
  );
}
