"use client";

import { useState } from "react";
import { BrainIcon, CircleCheckIcon, CircleXIcon, LightbulbIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { diagnosticQuestion as question } from "../mockdata";

export function DiagnosticQuestion() {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = submitted && selected === question.correctOptionId;

  return (
    <section
      aria-labelledby="diagnostic-title"
      className="flex flex-col gap-2 rounded-xl bg-surface-container p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <BrainIcon className="size-5 shrink-0 text-success" />
          <h3 id="diagnostic-title" className="text-title-md text-on-surface">
            {question.title}
          </h3>
        </div>
        <span className="shrink-0 rounded bg-surface-container-high px-1.5 py-0.5 text-mono-data text-[11px] text-success">
          {question.chapter}
        </span>
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-4">
        <div className="flex items-start justify-between gap-1">
          <p className="text-body-md text-on-surface">
            <span className="text-mono-data font-semibold text-primary">Question {question.number}:</span>{" "}
            {question.promptBefore}{" "}
            <span className="text-mono-data text-tertiary">{question.promptHighlight}</span>
            {question.promptAfter}
          </p>
          <span className="shrink-0 rounded bg-surface-container px-1.5 py-0.5 text-mono-data text-[11px] text-on-surface-variant">
            {question.difficulty}
          </span>
        </div>

        <div className="rounded-lg bg-surface-container p-2 text-center text-base text-mono-data text-on-surface">
          {question.expression.limit}{" "}
          <span className="underline underline-offset-4">{question.expression.numerator}</span> ⁄{" "}
          <span className="underline underline-offset-4">{question.expression.denominator}</span>
        </div>

        <fieldset className="flex flex-col gap-1" disabled={submitted}>
          <legend className="sr-only">Answer options</legend>
          {question.options.map((option) => {
            const isSelected = selected === option.id;
            const isAnswer = option.id === question.correctOptionId;
            return (
              <label
                key={option.id}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-lg p-1.5 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
                  isSelected ? "bg-surface-container-high" : "bg-surface-container-high/60 hover:bg-surface-container-high",
                  submitted && isAnswer && "ring-1 ring-success",
                  submitted && isSelected && !isAnswer && "ring-1 ring-error",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="diagnostic-question"
                    value={option.id}
                    checked={isSelected}
                    onChange={() => setSelected(option.id)}
                    className="size-4 shrink-0 accent-primary"
                  />
                  <span className="text-body-sm text-on-surface">{option.text}</span>
                </span>
                {submitted && isAnswer && <CircleCheckIcon className="size-4 shrink-0 text-success" />}
                {submitted && isSelected && !isAnswer && (
                  <CircleXIcon className="size-4 shrink-0 text-error" />
                )}
              </label>
            );
          })}
        </fieldset>

        {submitted && (
          <div
            role="status"
            className={cn(
              "flex items-start gap-1 rounded-lg p-1.5",
              correct ? "bg-success/15 text-success ring-1 ring-success" : "bg-error/10 text-error",
            )}
          >
            <LightbulbIcon className="mt-0.5 size-4 shrink-0" />
            <div className="text-body-sm">
              {!correct && <p className="font-semibold">{question.wrongLabel}</p>}
              <strong className="font-semibold">{question.explanationTitle}</strong>{" "}
              {question.explanationBefore}{" "}
              <code className="text-mono-data">{question.explanationCode}</code>{" "}
              {question.explanationMiddle}{" "}
              <code className="text-mono-data">{question.explanationCode2}</code>{" "}
              {question.explanationAfter}
            </div>
          </div>
        )}

        <div className="flex flex-col items-start justify-between gap-2 pt-1 sm:flex-row sm:items-center">
          <span className="text-mono-data text-[11px] text-on-surface-variant">{question.footnote}</span>
          {submitted && !correct ? (
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setSelected(null);
              }}
              className="rounded-lg bg-surface-container-high px-4 py-1.5 text-label-md text-on-surface transition-colors hover:bg-surface-bright"
            >
              Try again
            </button>
          ) : (
            <button
              type="button"
              disabled={!selected || submitted}
              onClick={() => setSubmitted(true)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-label-md shadow-sm transition-colors disabled:cursor-not-allowed",
                correct
                  ? "bg-success text-on-secondary"
                  : "bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50",
              )}
            >
              {correct ? question.correctLabel : question.submitLabel}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
