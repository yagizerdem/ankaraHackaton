import { CpuIcon, DatabaseIcon, GitForkIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { DashboardData } from "@/app/student-panel/dashboard/data";

// What the system actually runs, so these stay true for every student.
const ENGINES = [
  { label: "Beta-Bernoulli mastery", icon: CpuIcon, iconClassName: "text-success" },
  { label: "DAG verified", icon: GitForkIcon, iconClassName: "text-primary" },
  { label: "Vector RAG", icon: DatabaseIcon, iconClassName: "text-tertiary" },
];

function summaryOf(data: DashboardData) {
  if (data.documents.count === 0) {
    return "Upload a course document to get started. LearnGraph maps its topics and prerequisites, then writes exams from it.";
  }
  if (!data.documentName) {
    return `${data.documents.count} ${data.documents.count === 1 ? "document" : "documents"} uploaded. Run the pipeline to build a knowledge graph you can study and take exams on.`;
  }
  const { measured, topicCount } = data.overall;
  if (measured === 0) {
    return `${topicCount} topics mapped and none measured yet. Take an exam to see where you stand.`;
  }
  const gap = data.bottleneck
    ? ` Biggest gap: ${data.bottleneck.topic}.`
    : " No weak topics so far.";
  return `${measured} of ${topicCount} topics measured from ${data.overall.correct + data.overall.incorrect} answers.${gap}`;
}

export function WelcomeBanner({ data }: { data: DashboardData }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-6 shadow-sm">
      <div className="pointer-events-none absolute -top-16 -right-16 size-80 rounded-full bg-primary-container/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 size-64 rounded-full bg-secondary-container/10 blur-2xl" />
      <div className="relative flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex max-w-3xl flex-col gap-1">
          <h1 className="text-headline-xl-mobile text-on-surface sm:text-headline-lg">
            Welcome, {data.firstName}!
            {data.documentName && (
              <>
                {" "}
                You&apos;re studying{" "}
                <span className="font-normal text-primary">{data.documentName}</span>.
              </>
            )}
          </h1>
          <p className="text-body-md text-on-surface-variant">{summaryOf(data)}</p>
        </div>
        <ul className="flex flex-wrap items-center gap-1">
          {ENGINES.map((engine) => {
            const Icon = engine.icon;
            return (
              <li
                key={engine.label}
                className="flex items-center gap-1 rounded-lg bg-surface-container px-2 py-1.5 text-mono-data text-on-surface-variant"
              >
                <Icon aria-hidden className={cn("size-4", engine.iconClassName)} />
                {engine.label}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
