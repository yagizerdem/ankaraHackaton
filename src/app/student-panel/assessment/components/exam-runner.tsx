"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  CompassIcon,
  LoaderCircleIcon,
  RotateCwIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import { fetchExam, submitAnswer } from "@/app/student-panel/assessment/api";
import { ExamResults } from "@/app/student-panel/assessment/components/exam-results";
import { cn } from "@/lib/utils";

import type {
  AnswerFeedback,
  AssessmentView,
  QuestionView,
} from "@/domain/assessment";
import type { ApiResponse } from "@/lib/api-response";

const DIFFICULTY_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };

export function ExamRunner({ initial }: { initial: AssessmentView }) {
  const [view, setView] = useState(initial);
  const [choice, setChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [checking, setChecking] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const nextExam = useRef<Promise<ApiResponse<AssessmentView>> | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to each new question so keyboard users start at the top.
  useEffect(() => {
    headingRef.current?.focus();
  }, [view.current?.id]);

  async function check(question: QuestionView) {
    if (!choice) return;
    setChecking(true);
    const response = await submitAnswer(view.id, {
      questionId: question.id,
      optionId: choice as "a" | "b" | "c" | "d",
    });
    setChecking(false);

    if (!response.isSuccess || !response.data) {
      toast.error(response.message ?? "Couldn't check your answer");
      return;
    }
    setFeedback(response.data);
    // Write the next question while the student reads the explanation.
    if (response.data.assessment.status === "in_progress") {
      nextExam.current = fetchExam(view.id);
    }
  }

  async function goNext() {
    if (feedback?.assessment.status === "completed") {
      setView(feedback.assessment);
      setFeedback(null);
      return;
    }
    setLoadingNext(true);
    setLoadError(null);
    const response = await (nextExam.current ?? fetchExam(view.id));
    nextExam.current = null;
    setLoadingNext(false);

    if (!response.isSuccess || !response.data?.current) {
      setLoadError(response.message ?? "Couldn't prepare the next question");
      return;
    }
    setView(response.data);
    setFeedback(null);
    setChoice(null);
  }

  if (view.status === "completed" && view.results) {
    return <ExamResults view={view} />;
  }

  const question = view.current;
  const answered = feedback ? view.answeredCount + 1 : view.answeredCount;
  const progress = (answered / view.questionBudget) * 100;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/student-panel/assessment"
            className="inline-flex items-center gap-1 rounded text-label-md text-on-surface-variant outline-none hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeftIcon aria-hidden className="size-4" />
            All exams
          </Link>
          <span className="truncate text-label-md text-on-surface-variant">
            {view.documentName}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Exam progress"
          aria-valuemin={0}
          aria-valuemax={view.questionBudget}
          aria-valuenow={answered}
          aria-valuetext={`${answered} of ${view.questionBudget} answered`}
          className="h-1.5 overflow-hidden rounded-full bg-surface-container-highest"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {!question ? (
        <RetryCard
          message={loadError ?? "The next question isn't ready yet."}
          pending={loadingNext}
          onRetry={goNext}
        />
      ) : (
        <article className="flex flex-col gap-5 rounded-xl bg-surface-container p-4 sm:p-6">
          <header className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-label-md text-on-surface-variant">
              <span className="tabular-nums">
                Question {question.number} of {view.questionBudget}
              </span>
              <span className="rounded bg-primary/15 px-1.5 py-px text-label-sm text-primary">
                {question.topicLabel}
              </span>
              <span className="rounded bg-surface-container-highest px-1.5 py-px text-label-sm">
                {DIFFICULTY_LABEL[question.difficulty]}
              </span>
            </div>
            {question.reason && (
              <p className="flex items-start gap-1.5 text-body-sm text-on-surface-variant">
                <CompassIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-tertiary" />
                {question.reason}
              </p>
            )}
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-headline-md text-on-surface outline-none"
            >
              {question.prompt}
            </h2>
          </header>

          <fieldset disabled={checking || Boolean(feedback)} className="flex flex-col gap-2">
            <legend className="sr-only">Choose one answer</legend>
            {question.options.map((option) => {
              const isChoice = choice === option.id;
              const isCorrect = feedback?.correctOptionId === option.id;
              const isWrongChoice = feedback && isChoice && !feedback.correct;
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
                    !feedback && isChoice && "border-primary bg-primary/10",
                    !feedback && !isChoice && "border-outline-variant hover:bg-surface-container-high",
                    feedback && "cursor-default",
                    isCorrect && "border-success bg-success/10",
                    isWrongChoice && "border-error bg-error/10",
                    feedback && !isCorrect && !isWrongChoice && "border-outline-variant opacity-70",
                  )}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option.id}
                    checked={isChoice}
                    onChange={() => setChoice(option.id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-label-md uppercase",
                      isCorrect
                        ? "border-success bg-success text-on-secondary"
                        : isWrongChoice
                          ? "border-error bg-error text-on-error"
                          : isChoice
                            ? "border-primary bg-primary text-on-primary"
                            : "border-outline-variant text-on-surface-variant",
                    )}
                  >
                    {option.id}
                  </span>
                  <span className="text-body-md text-on-surface">{option.text}</span>
                  {isCorrect && (
                    <span className="ml-auto shrink-0 text-label-sm text-success">Correct answer</span>
                  )}
                  {isWrongChoice && (
                    <span className="ml-auto shrink-0 text-label-sm text-error">Your answer</span>
                  )}
                </label>
              );
            })}
          </fieldset>

          <div aria-live="polite">
            {feedback && <FeedbackPanel feedback={feedback} />}
          </div>

          {loadError && feedback && (
            <p role="alert" className="text-body-sm text-error">
              {loadError}
            </p>
          )}

          <div className="flex justify-end">
            {feedback ? (
              <button
                type="button"
                onClick={goNext}
                disabled={loadingNext}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:opacity-80"
              >
                {loadingNext ? (
                  <>
                    <LoaderCircleIcon aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
                    Writing the next question...
                  </>
                ) : feedback.assessment.status === "completed" ? (
                  <>
                    See results
                    <ArrowRightIcon aria-hidden className="size-4" />
                  </>
                ) : (
                  <>
                    {loadError ? "Try again" : "Next question"}
                    <ArrowRightIcon aria-hidden className="size-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => check(question)}
                disabled={!choice || checking}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checking && (
                  <LoaderCircleIcon aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
                )}
                {checking ? "Checking..." : "Check answer"}
              </button>
            )}
          </div>
        </article>
      )}
    </div>
  );
}

function FeedbackPanel({ feedback }: { feedback: AnswerFeedback }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4",
        feedback.correct ? "border-success/40 bg-success/5" : "border-error/40 bg-error/5",
      )}
    >
      <p
        className={cn(
          "flex items-center gap-2 text-title-md",
          feedback.correct ? "text-success" : "text-error",
        )}
      >
        {feedback.correct ? (
          <CheckCircle2Icon aria-hidden className="size-5" />
        ) : (
          <XCircleIcon aria-hidden className="size-5" />
        )}
        {feedback.correct ? "Correct" : "Not quite"}
      </p>
      <p className="text-body-md text-on-surface">{feedback.explanation}</p>

      {(feedback.sources.length > 0 || feedback.sourcePages.length > 0) && (
        <details className="group text-body-sm text-on-surface-variant">
          <summary className="cursor-pointer rounded text-label-md text-on-surface outline-none focus-visible:ring-2 focus-visible:ring-primary">
            From your document
            {feedback.sourcePages.length > 0 &&
              ` (page${feedback.sourcePages.length > 1 ? "s" : ""} ${feedback.sourcePages.join(", ")})`}
          </summary>
          <ul className="mt-2 flex flex-col gap-2">
            {feedback.sources.map((source) => (
              <li
                key={source.id}
                className="border-l-2 border-outline-variant pl-3"
              >
                <blockquote>{source.excerpt}</blockquote>
                <span className="text-mono-data text-outline">
                  Lines {source.lines.from}-{source.lines.to}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function RetryCard({
  message,
  pending,
  onRetry,
}: {
  message: string;
  pending: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-container px-6 py-10 text-center">
      <p role="alert" className="text-body-md text-on-surface">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:opacity-80"
      >
        <RotateCwIcon
          aria-hidden
          className={cn("size-4", pending && "animate-spin motion-reduce:animate-none")}
        />
        {pending ? "Writing the question..." : "Try again"}
      </button>
    </div>
  );
}
