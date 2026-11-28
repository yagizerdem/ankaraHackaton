import { Suspense } from "react";

import { GraphPreview } from "@/app/student-panel/dashboard/components/graph-preview";
import { LearningPath } from "@/app/student-panel/dashboard/components/learning-path";
import { QuickCheck } from "@/app/student-panel/dashboard/components/quick-check";
import { StatCards } from "@/app/student-panel/dashboard/components/stat-cards";
import { UploadCenter } from "@/app/student-panel/dashboard/components/upload-center";
import { WelcomeBanner } from "@/app/student-panel/dashboard/components/welcome-banner";
import { getDashboard } from "@/app/student-panel/dashboard/data";
import { GraphSelect } from "@/app/student-panel/learning-path/components/graph-select";
import { SignInGate } from "@/app/student-panel/uploads/components/sign-in-gate";

export default function DashboardPage({
  searchParams,
}: PageProps<"/student-panel/dashboard">) {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6">
      {/* Session and search params are request-time data, so this streams in. */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function DashboardContent({
  searchParams,
}: Pick<PageProps<"/student-panel/dashboard">, "searchParams">) {
  const { graph } = await searchParams;
  const data = await getDashboard(typeof graph === "string" ? graph : undefined);

  if (!data) {
    return (
      <>
        <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
          Dashboard
        </h1>
        <SignInGate />
      </>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <WelcomeBanner data={data} />
        {data.selectedGraphId && (
          <GraphSelect graphs={data.graphs} selectedId={data.selectedGraphId} />
        )}
        <StatCards data={data} />
      </section>

      <UploadCenter data={data} />

      {data.graph && data.selectedGraphId && (
        <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <GraphPreview
              graph={data.graph}
              graphId={data.selectedGraphId}
              documentName={data.documentName ?? ""}
              diagnosis={data.diagnosis}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-5">
            <LearningPath data={data} />
            <QuickCheck data={data} />
          </div>
        </section>
      )}
    </>
  );
}

function DashboardSkeleton() {
  const block = "animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none";
  return (
    <div aria-busy="true" aria-label="Loading your dashboard" className="flex flex-col gap-6">
      <div className={`h-36 ${block}`} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className={`h-40 ${block}`} />
        ))}
      </div>
      <div className={`h-72 ${block}`} />
    </div>
  );
}
