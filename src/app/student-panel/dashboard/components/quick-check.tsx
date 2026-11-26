"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrainIcon, LoaderCircleIcon, PlayIcon } from "lucide-react";
import { toast } from "sonner";

import { startExam } from "@/app/student-panel/assessment/api";

import type { DashboardData } from "@/app/student-panel/dashboard/data";

/**
 * Resumes the exam in progress, or starts a short adaptive check aimed at the
 * diagnosis's topic (the root cause or the weakest topic).
 */
export function QuickCheck({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const exam = data.inProgressExam;
  const target = data.diagnosis?.topicId ?? null;

  async function start() {
    if (!data.selectedGraphId) return;
    setPending(true);
    const response = await startExam({
      graphId: data.selectedGraphId,
      targetTopicId: target ?? undefined,
      questionBudget: 6,
    });
    if (!response.isSuccess || !response.data) {
      setPending(false);
      toast.error(response.message ?? "Couldn't start the check");
      return;
    }
    router.push(`/student-panel/assessment/${response.data.id}`);
  }

  return (
    <section
      aria-labelledby="quick-check-title"
      className="flex flex-col gap-3 rounded-xl bg-surface-container p-4 shadow-sm"
    >
      <div className="flex items-center gap-1">
        <BrainIcon aria-hidden className="size-5 shrink-0 text-success" />
        <h2 id="quick-check-title" className="text-title-md text-on-surface">
          {exam ? "Exam in progress" : "Quick check"}
        </h2>
      </div>

      {exam ? (
        <>
          <p className="text-body-sm text-on-surface-variant">
            You&apos;ve answered {exam.answeredCount} of {exam.questionBudget}{" "}
            questions on {exam.documentName}. Pick up where you left off.
          </p>
          <Link
            href={`/student-panel/assessment/${exam.id}`}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <PlayIcon aria-hidden className="size-4" />
            Continue exam
          </Link>
        </>
      ) : (
        <>
          <p className="text-body-sm text-on-surface-variant">
            {data.diagnosis?.topicLabel
              ? `Six adaptive questions aimed at ${data.diagnosis.topicLabel}. If you struggle, the check moves on to its prerequisites.`
              : "Six adaptive questions on the key topics of this document, written from its text."}
          </p>
          <button
            type="button"
            onClick={start}
            disabled={pending}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:opacity-80"
          >
            {pending ? (
              <LoaderCircleIcon aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
            ) : (
              <PlayIcon aria-hidden className="size-4" />
            )}
            {pending ? "Writing your questions, about a minute..." : "Start a quick check"}
          </button>
        </>
      )}
    </section>
  );
}
