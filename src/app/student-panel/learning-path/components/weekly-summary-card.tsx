"use client";

import { useState } from "react";
import { LoaderCircleIcon, MailIcon, RotateCwIcon } from "lucide-react";
import { toast } from "sonner";

import { writeSummary } from "@/app/student-panel/learning-path/api";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

interface WeeklySummaryCardProps {
  graphId: string;
  summary: { text: string; createdAt: string } | null;
  /** The teacher's report shows the note without the button. */
  readOnly?: boolean;
}

export function WeeklySummaryCard({ graphId, summary, readOnly }: WeeklySummaryCardProps) {
  const [current, setCurrent] = useState(summary);
  const [pending, setPending] = useState(false);

  async function generate() {
    setPending(true);
    const response = await writeSummary(graphId);
    setPending(false);
    if (!response.isSuccess || !response.data) {
      toast.error(response.message ?? "Couldn't write the summary");
      return;
    }
    setCurrent(response.data);
  }

  return (
    <section
      aria-labelledby="summary-title"
      aria-busy={pending}
      className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-surface-container p-4 sm:p-6"
    >
      <h2 id="summary-title" className="flex items-center gap-2 text-title-md text-on-surface">
        <MailIcon aria-hidden className="size-5 text-primary" />
        Your week
      </h2>

      {current ? (
        <>
          <p className="text-body-md text-on-surface">{current.text}</p>
          <p className="text-body-sm text-on-surface-variant">
            Written by Gemini from {readOnly ? "the student's" : "your"} exam
            numbers on{" "}
            <time dateTime={current.createdAt}>
              {dateFormat.format(new Date(current.createdAt))}
            </time>
            .
          </p>
        </>
      ) : (
        <p className="text-body-sm text-on-surface-variant">
          {readOnly
            ? "No weekly note written yet."
            : "Get a short note on your last 7 days: what went well, what to fix and what to do next. It's written from your real numbers only."}
        </p>
      )}

      {!readOnly && (
        <button
          type="button"
          onClick={generate}
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-outline-variant px-3 py-1.5 text-label-md text-on-surface transition-colors outline-none hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? (
            <LoaderCircleIcon aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <RotateCwIcon aria-hidden className="size-4" />
          )}
          {pending ? "Writing..." : current ? "Write a new note" : "Write my weekly note"}
        </button>
      )}
    </section>
  );
}
