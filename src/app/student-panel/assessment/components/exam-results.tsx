"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LightbulbIcon, LoaderCircleIcon, RotateCwIcon } from "lucide-react";
import { toast } from "sonner";

import { startExam } from "@/app/student-panel/assessment/api";
import {
  MASTERY_STYLES,
  formatPercent,
} from "@/app/student-panel/assessment/mastery-styles";
import { cn } from "@/lib/utils";

import type { AssessmentView, GapAnalysis } from "@/domain/assessment";

/** Score, gap analysis per target topic, and mastery per tested topic. */
export function ExamResults({ view }: { view: AssessmentView }) {
  const results = view.results!;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <section className="flex flex-col gap-4 rounded-xl bg-surface-container p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-headline-md text-on-surface">Exam finished</h2>
          <p className="text-body-sm text-on-surface-variant">{view.documentName}</p>
        </div>
        <p className="text-headline-xl-mobile text-on-surface tabular-nums sm:text-headline-xl">
          {view.correctCount}
          <span className="text-headline-md text-on-surface-variant">
            /{view.answeredCount} correct
          </span>
        </p>
      </section>

      {results.gaps.map((gap) => (
        <GapCard key={gap.targetId} gap={gap} view={view} />
      ))}

      <section
        aria-labelledby="topics-title"
        className="flex flex-col gap-3 rounded-xl bg-surface-container p-4 sm:p-6"
      >
        <div className="flex flex-col gap-1">
          <h2 id="topics-title" className="text-title-md text-on-surface">
            Topics in this exam
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Mastery is estimated from all your answers on a topic, not just
            this exam.
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {results.topics.map((topic) => {
            const style = MASTERY_STYLES[topic.status];
            return (
              <li key={topic.topicId} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-label-md text-on-surface">{topic.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-mono-data text-on-surface-variant tabular-nums">
                      {topic.examCorrect}/{topic.examTotal} this exam
                    </span>
                    <span className={cn("rounded px-1.5 py-px text-label-sm", style.chip)}>
                      {topic.status === "unmeasured"
                        ? style.label
                        : `${style.label} · ${formatPercent(topic.mastery)}`}
                    </span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                  <div
                    className={cn("h-full rounded-full", style.bar)}
                    style={{ width: `${topic.mastery * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex justify-end">
        <Link
          href="/student-panel/assessment"
          className="rounded-lg border border-outline-variant px-4 py-2 text-label-md text-on-surface transition-colors outline-none hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary"
        >
          Back to exams
        </Link>
      </div>
    </div>
  );
}

function GapCard({ gap, view }: { gap: GapAnalysis; view: AssessmentView }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const style = MASTERY_STYLES[gap.targetStatus];

  async function retake() {
    setPending(true);
    const response = await startExam({
      graphId: view.graphId,
      targetTopicId: gap.targetId,
      questionBudget: view.questionBudget,
    });
    if (!response.isSuccess || !response.data) {
      setPending(false);
      toast.error(response.message ?? "Couldn't start the exam");
      return;
    }
    router.push(`/student-panel/assessment/${response.data.id}`);
  }

  return (
    <section
      aria-label={`What to study for ${gap.targetLabel}`}
      className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-surface-container p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-title-md text-on-surface">{gap.targetLabel}</h2>
        <span className={cn("rounded px-1.5 py-px text-label-sm", style.chip)}>
          {style.label}
        </span>
      </div>

      <p className="flex items-start gap-2 text-body-md text-on-surface">
        <LightbulbIcon aria-hidden className="mt-0.5 size-5 shrink-0 text-tertiary" />
        {gap.recommendation}
      </p>

      {(gap.weak.length > 0 || gap.unmeasured.length > 0) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {gap.weak.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-label-md text-on-surface">Prerequisites to review</h3>
              <ul className="flex flex-col gap-1">
                {gap.weak.map((topic) => (
                  <li
                    key={topic.id}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-body-sm text-on-surface",
                      // Below 50% is "needs work"; 50-80% is "developing".
                      topic.mastery < 0.5 ? "bg-error/10" : "bg-tertiary/10",
                    )}
                  >
                    {topic.label}
                    <span
                      className={cn(
                        "text-mono-data tabular-nums",
                        topic.mastery < 0.5 ? "text-error" : "text-tertiary",
                      )}
                    >
                      {formatPercent(topic.mastery)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {gap.unmeasured.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-label-md text-on-surface">Prerequisites not tested yet</h3>
              <ul className="flex flex-col gap-1">
                {gap.unmeasured.map((topic) => (
                  <li
                    key={topic.id}
                    className="rounded-lg bg-surface-container-high px-2 py-1 text-body-sm text-on-surface-variant"
                  >
                    {topic.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {gap.targetStatus !== "mastered" && (
        <button
          type="button"
          onClick={retake}
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:opacity-80"
        >
          {pending ? (
            <LoaderCircleIcon aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <RotateCwIcon aria-hidden className="size-4" />
          )}
          {pending ? "Writing your first question..." : `New exam on ${gap.targetLabel}`}
        </button>
      )}
    </section>
  );
}
