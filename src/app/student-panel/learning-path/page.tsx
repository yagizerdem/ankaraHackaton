import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { RouteIcon } from "lucide-react";

import { getKnowledgeGraphs } from "@/app/student-panel/knowledge-graph/data";
import { CalibrationCard } from "@/app/student-panel/learning-path/components/calibration-card";
import { GoalForm } from "@/app/student-panel/learning-path/components/goal-form";
import { GraphSelect } from "@/app/student-panel/learning-path/components/graph-select";
import { MistakeCard } from "@/app/student-panel/learning-path/components/mistake-card";
import { PathDays } from "@/app/student-panel/learning-path/components/path-days";
import { ShareButton } from "@/app/student-panel/learning-path/components/share-button";
import { WeeklySummaryCard } from "@/app/student-panel/learning-path/components/weekly-summary-card";
import { SignInGate } from "@/app/student-panel/uploads/components/sign-in-gate";
import { MAX_GOAL_DAYS, calendarDate } from "@/domain/learning-path";
import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { getLearningReport } from "@/lib/learning/report";

export default function LearningPathPage({
  searchParams,
}: PageProps<"/student-panel/learning-path">) {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6">
      {/* Session and search params are request-time data, so this streams in. */}
      <Suspense fallback={<PathSkeleton />}>
        <PathContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function PathHeader({ action }: { action?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
          Personal learning path
        </h1>
        <p className="text-body-md text-on-surface-variant">
          What to study, in what order, and how well you judge what you know.
        </p>
      </div>
      {action}
    </header>
  );
}

async function PathContent({
  searchParams,
}: Pick<PageProps<"/student-panel/learning-path">, "searchParams">) {
  const { graph } = await searchParams;

  await connection();
  const graphs = await getKnowledgeGraphs(typeof graph === "string" ? graph : undefined);
  if (!graphs) {
    return (
      <>
        <PathHeader />
        <SignInGate />
      </>
    );
  }

  if (!graphs.selected) {
    return (
      <>
        <PathHeader />
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 text-center">
          <RouteIcon aria-hidden className="size-7 text-on-surface-variant" />
          <p className="text-title-md text-on-surface">No route yet</p>
          <p className="max-w-sm text-body-sm text-on-surface-variant">
            A route is built from a document&apos;s knowledge graph. Upload a
            document and run the pipeline first.
          </p>
          <Link
            href="/student-panel/uploads"
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Go to uploads
          </Link>
        </div>
      </>
    );
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await dbConnect();
  const user = await verifySessionAndGetUser(token);
  if (!user) return <SignInGate />;

  const now = new Date();
  const report = await getLearningReport(user._id, graphs.selected.id, now);
  const minDate = calendarDate(now, 1);
  const maxDate = calendarDate(now, MAX_GOAL_DAYS);

  return (
    <>
      <PathHeader action={<ShareButton graphId={report.graphId} />} />
      <GraphSelect graphs={graphs.options} selectedId={report.graphId} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
          <GoalForm
            // Remount on graph change so the fields reset.
            key={report.graphId}
            graphId={report.graphId}
            topics={graphs.selected.topics.map(({ id, label }) => ({ id, label }))}
            goal={report.goal}
            minDate={minDate}
            maxDate={maxDate}
          />
          {report.path && <PathDays path={report.path} graphId={report.graphId} />}
          <MistakeCard mistakes={report.mistakes} />
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-5">
          <WeeklySummaryCard
            key={report.graphId}
            graphId={report.graphId}
            summary={report.summary}
          />
          <CalibrationCard calibration={report.calibration} />
        </div>
      </div>
    </>
  );
}

function PathSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading your learning path" className="flex flex-col gap-6">
      <PathHeader />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-80 animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none lg:col-span-7" />
        <div className="h-80 animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none lg:col-span-5" />
      </div>
    </div>
  );
}
