import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { AssessmentSummary } from "@/domain/assessment";

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function ExamHistory({ exams }: { exams: AssessmentSummary[] }) {
  return (
    <section
      aria-labelledby="history-title"
      className="flex flex-col gap-3 rounded-xl bg-surface-container p-4 sm:p-6"
    >
      <h2 id="history-title" className="text-title-md text-on-surface">
        Past exams
      </h2>

      {exams.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">
          Exams you take show up here, so you can see how your scores change.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-surface-container-highest/60">
          {exams.map((exam) => {
            const finished = exam.status === "completed";
            return (
              <li key={exam.id}>
                <Link
                  href={`/student-panel/assessment/${exam.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors outline-none hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-label-md text-on-surface">
                      {exam.documentName}
                    </span>
                    <time
                      dateTime={exam.createdAt}
                      className="text-mono-data text-on-surface-variant"
                    >
                      {dateFormat.format(new Date(exam.createdAt))}
                    </time>
                  </div>
                  <span className="text-mono-data text-on-surface tabular-nums">
                    {exam.correctCount}/{exam.answeredCount} correct
                  </span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-px text-label-sm whitespace-nowrap",
                      finished
                        ? "bg-success/15 text-success"
                        : "bg-tertiary/15 text-tertiary",
                    )}
                  >
                    {finished
                      ? "Finished"
                      : `In progress · ${exam.answeredCount}/${exam.questionBudget}`}
                  </span>
                  <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-outline" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
