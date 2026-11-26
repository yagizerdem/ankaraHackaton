"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { createExam } from "@/app/student-panel/custom-exams/api";
import {
  EXAM_DIFFICULTIES,
  EXAM_LANGUAGES,
  EXAM_LANGUAGE_LABELS,
  MAX_EXAM_QUESTIONS,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  createCustomExamSchema,
} from "@/domain/custom-exam";
import { cn, zodErrorToFromErrors } from "@/lib/utils";

import type { ExamDocumentOption } from "@/app/student-panel/custom-exams/data";
import type { ExamDifficulty, ExamLanguage, QuestionType } from "@/domain/custom-exam";
import type { FormErrors } from "@/error/app-error";

const schema = createCustomExamSchema();

const fieldClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60 aria-invalid:border-error";

const chipClass = (selected: boolean, pending: boolean) =>
  cn(
    "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-center text-label-md capitalize transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
    selected
      ? "border-primary bg-primary/10 text-on-surface"
      : "border-outline-variant text-on-surface-variant hover:bg-surface-container-high",
    pending && "pointer-events-none opacity-60",
  );

function FieldMessage({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <p id={id} className="text-body-sm text-error">
      {children}
    </p>
  );
}

export function GenerateExamForm({ documents }: { documents: ExamDocumentOption[] }) {
  const router = useRouter();
  const firstReady = documents.find((document) => document.chunkCount > 0);

  const [documentId, setDocumentId] = useState(firstReady?.id ?? "");
  const [title, setTitle] = useState("");
  const [types, setTypes] = useState<QuestionType[]>(["multiple_choice"]);
  const [difficulty, setDifficulty] = useState<ExamDifficulty>("medium");
  const [language, setLanguage] = useState<ExamLanguage>("english");
  const [questionCount, setQuestionCount] = useState("10");
  const [pending, setPending] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);

  function toggleType(type: QuestionType) {
    setTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : // Keep the fixed order, so the exam's sections are predictable.
          QUESTION_TYPES.filter((item) => item === type || current.includes(item)),
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const input = {
      documentId,
      title: title.trim() || undefined,
      types,
      difficulty,
      language,
      questionCount: Number(questionCount),
    };
    const parsed = schema.safeParse(input);
    if (!parsed.success) {
      setFormErrors(zodErrorToFromErrors(parsed.error));
      return;
    }
    setFormErrors({});

    setPending(true);
    const response = await createExam(input);
    if (!response.isSuccess || !response.data) {
      setPending(false);
      if (response.fromErrors) setFormErrors(response.fromErrors);
      const message = response.message ?? "Couldn't write the exam";
      setError(message);
      toast.error(message);
      return;
    }

    toast.success("Exam ready");
    // Keep the pending state while the exam page loads.
    router.push(`/student-panel/custom-exams/${response.data.id}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={pending}
      className="flex flex-col gap-4 rounded-xl bg-surface-container p-4 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-title-md text-on-surface">Create an exam</h2>
        <p className="text-body-sm text-on-surface-variant">
          Questions are written only from the document you pick, using the
          chunks embedded when you uploaded it.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="custom-exam-document" className="text-label-md text-on-surface">
          Document
        </label>
        <select
          id="custom-exam-document"
          value={documentId}
          disabled={pending}
          onChange={(event) => setDocumentId(event.target.value)}
          aria-invalid={!!formErrors.documentId}
          aria-describedby="custom-exam-document-error"
          className={fieldClass}
        >
          {!firstReady && <option value="">No embedded documents yet</option>}
          {documents.map((document) => (
            <option key={document.id} value={document.id} disabled={document.chunkCount === 0}>
              {document.chunkCount > 0
                ? `${document.name} (${document.chunkCount} chunks)`
                : `${document.name} (not embedded yet)`}
            </option>
          ))}
        </select>
        <FieldMessage id="custom-exam-document-error">{formErrors.documentId}</FieldMessage>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="custom-exam-title" className="text-label-md text-on-surface">
          Title <span className="text-on-surface-variant">(optional)</span>
        </label>
        <input
          id="custom-exam-title"
          value={title}
          maxLength={120}
          disabled={pending}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Named after the document when left empty"
          aria-invalid={!!formErrors.title}
          aria-describedby="custom-exam-title-error"
          className={cn(fieldClass, "placeholder:text-on-surface-variant/70")}
        />
        <FieldMessage id="custom-exam-title-error">{formErrors.title}</FieldMessage>
      </div>

      <fieldset className="flex flex-col gap-1.5" aria-describedby="custom-exam-types-error">
        <legend className="mb-1.5 text-label-md text-on-surface">Question types</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {QUESTION_TYPES.map((type) => (
            <label key={type} className={cn(chipClass(types.includes(type), pending), "normal-case")}>
              <input
                type="checkbox"
                checked={types.includes(type)}
                onChange={() => toggleType(type)}
                disabled={pending}
                className="sr-only"
              />
              {QUESTION_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
        <FieldMessage id="custom-exam-types-error">{formErrors.types}</FieldMessage>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-label-md text-on-surface">Difficulty</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EXAM_DIFFICULTIES.map((level) => (
            <label key={level} className={chipClass(difficulty === level, pending)}>
              <input
                type="radio"
                name="difficulty"
                value={level}
                checked={difficulty === level}
                onChange={() => setDifficulty(level)}
                disabled={pending}
                className="sr-only"
              />
              {level}
            </label>
          ))}
        </div>
        <FieldMessage id="custom-exam-difficulty-error">{formErrors.difficulty}</FieldMessage>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="custom-exam-count" className="text-label-md text-on-surface">
            Number of questions
          </label>
          <input
            id="custom-exam-count"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_EXAM_QUESTIONS}
            value={questionCount}
            disabled={pending}
            onChange={(event) => setQuestionCount(event.target.value)}
            aria-invalid={!!formErrors.questionCount}
            aria-describedby="custom-exam-count-hint custom-exam-count-error"
            className={cn(fieldClass, "tabular-nums")}
          />
          <p id="custom-exam-count-hint" className="text-body-sm text-on-surface-variant">
            1 to {MAX_EXAM_QUESTIONS}, split evenly across the types.
          </p>
          <FieldMessage id="custom-exam-count-error">{formErrors.questionCount}</FieldMessage>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="custom-exam-language" className="text-label-md text-on-surface">
            Language
          </label>
          <select
            id="custom-exam-language"
            value={language}
            disabled={pending}
            onChange={(event) => setLanguage(event.target.value as ExamLanguage)}
            className={fieldClass}
          >
            {EXAM_LANGUAGES.map((item) => (
              <option key={item} value={item}>
                {EXAM_LANGUAGE_LABELS[item]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !firstReady}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-label-md text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60 aria-busy:cursor-wait"
        aria-busy={pending}
      >
        {pending ? (
          <>
            <LoaderCircleIcon aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
            Writing your exam, this can take a minute...
          </>
        ) : (
          <>
            <SparklesIcon aria-hidden className="size-4" />
            Create exam
          </>
        )}
      </button>
    </form>
  );
}
