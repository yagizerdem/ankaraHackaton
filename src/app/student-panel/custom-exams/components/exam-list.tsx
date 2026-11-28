import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { DeleteExamButton } from "@/app/student-panel/custom-exams/components/delete-exam-button";
import { QUESTION_TYPE_LABELS } from "@/domain/custom-exam";

import type { CustomExamSummary } from "@/domain/custom-exam";

const dateFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function ExamList({ exams }: { exams: CustomExamSummary[] }) {
  return (
    <section
      aria-labelledby="custom-exams-title"
      className="flex flex-col gap-3 rounded-xl bg-surface-container p-4 sm:p-6"
    >
      <h2 id="custom-exams-title" className="text-title-md text-on-surface">
        Your exams
      </h2>

      {exams.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">
          Exams you create show up here, so you can open them again or
          download them as PDF.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-surface-container-highest/60">
          {exams.map((exam) => (
            <li key={exam.id} className="flex items-center gap-2 py-1">
              <Link
                href={`/student-panel/custom-exams/${exam.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 transition-colors outline-none hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-label-md text-on-surface">{exam.title}</span>
                  <span className="truncate text-body-sm text-on-surface-variant">
                    {exam.documentName} ·{" "}
                    {exam.types.map((type) => QUESTION_TYPE_LABELS[type]).join(", ")}
                  </span>
                  <time dateTime={exam.createdAt} className="text-mono-data text-on-surface-variant">
                    {dateFormat.format(new Date(exam.createdAt))}
                  </time>
                </div>
                <span className="hidden rounded bg-surface-container-highest px-1.5 py-px text-label-sm whitespace-nowrap text-on-surface-variant capitalize sm:inline">
                  {exam.difficulty}
                </span>
                <span className="text-mono-data whitespace-nowrap text-on-surface tabular-nums">
                  {exam.questionCount} Q
                </span>
                <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-outline" />
              </Link>
              <DeleteExamButton examId={exam.id} title={exam.title} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
