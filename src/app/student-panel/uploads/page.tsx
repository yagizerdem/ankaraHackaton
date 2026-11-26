import { Suspense } from "react";

import { RefreshButton } from "@/app/student-panel/uploads/components/refresh-button";
import { SignInGate } from "@/app/student-panel/uploads/components/sign-in-gate";
import { UploadButton } from "@/app/student-panel/uploads/components/upload-button";
import {
  UploadsList,
  UploadsStats,
} from "@/app/student-panel/uploads/components/uploads-list";
import { getUploads } from "@/app/student-panel/uploads/data";

export default function UploadsPage() {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6">
      {/* Reading the session cookie makes this part dynamic, so it streams in. */}
      <Suspense fallback={<UploadsSkeleton />}>
        <UploadsContent />
      </Suspense>
    </div>
  );
}

async function UploadsContent() {
  const uploads = await getUploads();

  if (!uploads) {
    return (
      <>
        <UploadsHeader />
        <SignInGate />
      </>
    );
  }

  return (
    <>
      <UploadsHeader
        action={
          <div className="flex flex-wrap items-center gap-2">
            <RefreshButton />
            <UploadButton />
          </div>
        }
      />
      <UploadsStats rows={uploads.rows} />
      <UploadsList rows={uploads.rows} />
    </>
  );
}

function UploadsHeader({ action }: { action?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
          Uploads
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Course materials you&apos;ve added. Each one becomes a knowledge graph.
        </p>
      </div>
      {action}
    </header>
  );
}

function UploadsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading uploads" className="flex flex-col gap-6">
      <UploadsHeader />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-[5.75rem] animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none" />
    </div>
  );
}
