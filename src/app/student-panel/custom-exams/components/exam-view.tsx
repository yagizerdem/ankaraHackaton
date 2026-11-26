"use client";

import { useState } from "react";
import { DownloadIcon, EyeIcon, EyeOffIcon, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { QUESTION_TYPE_LABELS } from "@/domain/custom-exam";
import { downloadExamPdf } from "@/lib/custom-exam/pdf";
import { cn } from "@/lib/utils";

import type { CustomExam, CustomExamQuestion } from "@/domain/custom-exam";

const secondaryButton =
  "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-label-md text-on-surface transition-colors outline-none hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60";

type PdfKind = "questions" | "answers";

function Answer({ question }: { question: CustomExamQuestion }) {
  const answer =
    question.type === "true_false"
      ? question.answer === "true"
        ? "True"
        : "False"
      : question.type === "multiple_choice"
        ? `${question.answer.toUpperCase()}) ${question.options.find((o) => o.id === question.answer)?.text ?? ""}`
        : question.answer;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-success/10 px-3 py-2.5 text-body-sm text-on-surface">
      <p>
        <span className="text-label-md text-success">Answer: </span>
        {answer}
      </p>
      {question.explanation && (
        <p className="text-on-surface-variant">{question.explanation}</p>
      )}
      {question.sourceExcerpt && (
        <blockquote className="border-l-2 border-outline-variant pl-2 text-on-surface-variant italic">
          “{question.sourceExcerpt}”
        </blockquote>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  number,
  showAnswer,
}: {
  question: CustomExamQuestion;
  number: number;
  showAnswer: boolean;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-surface-container p-4 sm:p-5">
      <p className="text-body-md text-on-surface">
        <span className="mr-1.5 text-label-md text-on-surface-variant tabular-nums">{number}.</span>
        {question.prompt}
      </p>

      {question.type === "multiple_choice" && (
        <ul className="flex flex-col gap-1.5">
          {question.options.map((option) => {
            const correct = showAnswer && option.id === question.answer;
            return (
              <li
                key={option.id}
                className={cn(
                  "flex gap-2 rounded-lg border px-3 py-2 text-body-sm",
                  correct
                    ? "border-success bg-success/10 text-on-surface"
                    : "border-outline-variant text-on-surface",
                )}
              >
                <span className="text-label-md text-on-surface-variant uppercase">{option.id})</span>
                <span>{option.text}</span>
              </li>
            );
          })}
        </ul>
      )}

      {question.type === "true_false" && !showAnswer && (
        <p className="text-body-sm text-on-surface-variant">True or false?</p>
      )}

      {showAnswer && <Answer question={question} />}

      {question.keywords.length > 0 && (
        <ul aria-label="Keywords" className="flex flex-wrap gap-1.5">
          {question.keywords.map((keyword) => (
            <li
              key={keyword}
              className="rounded bg-surface-container-highest px-1.5 py-px text-label-sm text-on-surface-variant"
            >
              {keyword}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function ExamView({ exam }: { exam: CustomExam }) {
  const [showAnswers, setShowAnswers] = useState(false);
  const [exporting, setExporting] = useState<PdfKind | null>(null);

  async function exportPdf(kind: PdfKind) {
    setExporting(kind);
    try {
      await downloadExamPdf(exam, { withAnswers: kind === "answers" });
    } catch (error) {
      console.error(error);
      toast.error("Couldn't create the PDF, try again");
    } finally {
      setExporting(null);
    }
  }

  // Number questions continuously across the type sections.
  const numbered = exam.types
    .flatMap((type) => exam.questions.filter((question) => question.type === type))
    .map((question, index) => ({ question, number: index + 1 }));
  const sections = exam.types
    .map((type) => ({
      type,
      questions: numbered.filter((item) => item.question.type === type),
    }))
    .filter((section) => section.questions.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowAnswers((value) => !value)}
          aria-pressed={showAnswers}
          className={secondaryButton}
        >
          {showAnswers ? (
            <EyeOffIcon aria-hidden className="size-4" />
          ) : (
            <EyeIcon aria-hidden className="size-4" />
          )}
          {showAnswers ? "Hide answers" : "Show answers"}
        </button>
        {(["questions", "answers"] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => exportPdf(kind)}
            disabled={exporting !== null}
            aria-busy={exporting === kind}
            className={secondaryButton}
          >
            {exporting === kind ? (
              <LoaderCircleIcon aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
            ) : (
              <DownloadIcon aria-hidden className="size-4" />
            )}
            {kind === "questions" ? "PDF" : "PDF with answer key"}
          </button>
        ))}
      </div>

      {sections.map((section) => (
        <section key={section.type} aria-labelledby={`section-${section.type}`} className="flex flex-col gap-3">
          <h2 id={`section-${section.type}`} className="text-title-md text-on-surface">
            {QUESTION_TYPE_LABELS[section.type]}{" "}
            <span className="text-body-sm text-on-surface-variant">
              ({section.questions.length})
            </span>
          </h2>
          <ol className="flex flex-col gap-3">
            {section.questions.map(({ question, number }) => (
              <QuestionCard
                key={number}
                question={question}
                number={number}
                showAnswer={showAnswers}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
