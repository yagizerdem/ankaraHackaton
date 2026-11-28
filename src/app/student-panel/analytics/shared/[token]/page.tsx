import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { EyeIcon } from "lucide-react";

import { MasteryPanel } from "@/app/student-panel/assessment/components/mastery-panel";
import { CalibrationCard } from "@/app/student-panel/learning-path/components/calibration-card";
import { MistakeCard } from "@/app/student-panel/learning-path/components/mistake-card";
import { PathDays } from "@/app/student-panel/learning-path/components/path-days";
import { WeeklySummaryCard } from "@/app/student-panel/learning-path/components/weekly-summary-card";
import { hashSessionToken } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { getLearningReport } from "@/lib/learning/report";
import { ShareLink } from "@/models/share-link";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student report",
  // Private links must never end up in a search index.
  robots: { index: false, follow: false },
};

export default function SharedReportPage({
  params,
}: PageProps<"/student-panel/analytics/shared/[token]">) {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6">
      <Suspense
        fallback={
          <div
            aria-busy="true"
            aria-label="Loading the report"
            className="h-96 animate-pulse rounded-xl bg-surface-container motion-reduce:animate-none"
          />
        }
      >
        <ReportContent params={params} />
      </Suspense>
    </div>
  );
}

async function ReportContent({
  params,
}: Pick<PageProps<"/student-panel/analytics/shared/[token]">, "params">) {
  const { token } = await params;

  await connection();
  await dbConnect();
  // No sign-in: the unguessable token is the permission. Expired links are
  // also filtered here, since the TTL sweep can lag.
  const link = await ShareLink.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!link) notFound();

  const report = await getLearningReport(link.userId, link.graphId).catch(() => null);
  // The student may have deleted the document since sharing.
  if (!report) notFound();

  return (
    <>
      <header className="flex flex-col gap-2">
        <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary/15 px-2.5 py-0.5 text-label-md text-primary">
          <EyeIcon aria-hidden className="size-3.5" />
          Shared by the student · read-only
        </p>
        <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
          {report.studentName}&apos;s progress
        </h1>
        <p className="text-body-md text-on-surface-variant">
          {report.documentName}. This is the student&apos;s own view of their
          learning path, so it speaks to them.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
          <WeeklySummaryCard graphId={report.graphId} summary={report.summary} readOnly />
          {report.path ? (
            <PathDays path={report.path} graphId={report.graphId} interactive={false} />
          ) : (
            <p className="rounded-xl bg-surface-container p-4 text-body-sm text-on-surface-variant sm:p-6">
              The student hasn&apos;t set a goal yet, so there is no route.
            </p>
          )}
          <MistakeCard mistakes={report.mistakes} />
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-5">
          <CalibrationCard calibration={report.calibration} />
          <MasteryPanel
            rows={report.topics.map((topic) => ({ ...topic, topicId: topic.id }))}
          />
        </div>
      </div>
    </>
  );
}
