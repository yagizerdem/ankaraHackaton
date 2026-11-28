import { Suspense } from "react";
import Link from "next/link";
import { ClipboardCheckIcon } from "lucide-react";

import { ExamHistory } from "@/app/student-panel/assessment/components/exam-history";
import { MasteryPanel } from "@/app/student-panel/assessment/components/mastery-panel";
import { StartExamForm } from "@/app/student-panel/assessment/components/start-exam-form";
import { getAssessmentHome } from "@/app/student-panel/assessment/data";
import { SignInGate } from "@/app/student-panel/uploads/components/sign-in-gate";

export default function AssessmentPage({
  searchParams,
}: PageProps<"/student-panel/assessment">) {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
          Adaptive exam
        </h1>
        <p className="text-body-md text-on-surface-variant">
          Find out what you know, and which prerequisite to study next.
        </p>
      </header>

      {/* Session and search params are request-time data, so this streams in. */}
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function HomeContent({
  searchParams,
}: Pick<PageProps<"/student-panel/assessment">, "searchParams">) {
  const { graph } = await searchParams;
  const home = await getAssessmentHome(typeof graph === "string" ? graph : undefined);

  if (!home) return <SignInGate />;

  if (!home.selectedGraphId) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 text-center">
        <ClipboardCheckIcon aria-hidden className="size-7 text-on-surface-variant" />
        <p className="text-title-md text-on-surface">No exams to take yet</p>
        <p className="max-w-sm text-body-sm text-on-surface-variant">
          Exams are written from a document&apos;s knowledge graph. Upload a
          document and run the pipeline first.
        </p>
        <Link
          href="/student-panel/uploads"
          className="mt-2 rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Go to uploads
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
        <StartExamForm
          // Remount on graph change so the target topic resets.
          key={home.selectedGraphId}
          graphs={home.graphs}
          selectedGraphId={home.selectedGraphId}
          topics={home.mastery}
        />
        <ExamHistory exams={home.exams} />
      </div>
      <div className="min-w-0 lg:col-span-5">
        <MasteryPanel rows={home.mastery} />
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading exams"
      className="grid grid-cols-1 gap-6 lg:grid-cols-12"
    >
      <div className="h-96 animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none lg:col-span-7" />
      <div className="h-96 animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none lg:col-span-5" />
    </div>
  );
}
