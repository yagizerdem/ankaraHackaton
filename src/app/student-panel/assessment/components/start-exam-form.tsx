"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon, PlayIcon } from "lucide-react";
import { toast } from "sonner";

import { startExam } from "@/app/student-panel/assessment/api";
import { QUESTION_BUDGETS } from "@/domain/assessment";
import { cn } from "@/lib/utils";

import type { GraphOption } from "@/app/student-panel/knowledge-graph/data";

const KEY_TOPICS = "";

const fieldClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60";

interface StartExamFormProps {
  graphs: GraphOption[];
  selectedGraphId: string;
  topics: { topicId: string; label: string }[];
}

export function StartExamForm({ graphs, selectedGraphId, topics }: StartExamFormProps) {
  const router = useRouter();
  const [targetTopicId, setTargetTopicId] = useState(KEY_TOPICS);
  const [questionBudget, setQuestionBudget] = useState<number>(9);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await startExam({
      graphId: selectedGraphId,
      targetTopicId: targetTopicId || undefined,
      questionBudget,
    });

    if (!response.isSuccess || !response.data) {
      setPending(false);
      const message =
        Object.values(response.fromErrors ?? {})[0] ??
        response.message ??
        "Couldn't start the exam";
      setError(message);
      toast.error(message);
      return;
    }
    // Keep the pending state while the exam page loads.
    router.push(`/student-panel/assessment/${response.data.id}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={pending}
      className="flex flex-col gap-4 rounded-xl bg-surface-container p-4 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-title-md text-on-surface">Start an exam</h2>
        <p className="text-body-sm text-on-surface-variant">
          Questions are written from your document and adapt to your answers.
          When you struggle with a topic, the exam checks its prerequisites.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="exam-graph" className="text-label-md text-on-surface">
          Document
        </label>
        <select
          id="exam-graph"
          value={selectedGraphId}
          disabled={pending}
          onChange={(event) => {
            setTargetTopicId(KEY_TOPICS);
            router.push(`/student-panel/assessment?graph=${event.target.value}`, {
              scroll: false,
            });
          }}
          className={fieldClass}
        >
          {graphs.map((graph) => (
            <option key={graph.id} value={graph.id}>
              {graph.documentName} ({graph.topicCount} topics)
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="exam-target" className="text-label-md text-on-surface">
          Target topic
        </label>
        <select
          id="exam-target"
          value={targetTopicId}
          disabled={pending}
          onChange={(event) => setTargetTopicId(event.target.value)}
          aria-describedby="exam-target-hint"
          className={fieldClass}
        >
          <option value={KEY_TOPICS}>Key topics of the document</option>
          {topics.map((topic) => (
            <option key={topic.topicId} value={topic.topicId}>
              {topic.label}
            </option>
          ))}
        </select>
        <p id="exam-target-hint" className="text-body-sm text-on-surface-variant">
          Pick a topic you want to learn, and the exam will find which
          prerequisites are holding you back.
        </p>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-label-md text-on-surface">Questions</legend>
        <div className="flex gap-2">
          {QUESTION_BUDGETS.map((budget) => (
            <label
              key={budget}
              className={cn(
                "flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-label-md transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
                questionBudget === budget
                  ? "border-primary bg-primary/10 text-on-surface"
                  : "border-outline-variant text-on-surface-variant hover:bg-surface-container-high",
                pending && "pointer-events-none opacity-60",
              )}
            >
              <input
                type="radio"
                name="questionBudget"
                value={budget}
                checked={questionBudget === budget}
                onChange={() => setQuestionBudget(budget)}
                disabled={pending}
                className="sr-only"
              />
              {budget}
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-label-md text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:opacity-80"
      >
        {pending ? (
          <>
            <LoaderCircleIcon
              aria-hidden
              className="size-4 animate-spin motion-reduce:animate-none"
            />
            Writing your first question...
          </>
        ) : (
          <>
            <PlayIcon aria-hidden className="size-4" />
            Start exam
          </>
        )}
      </button>
    </form>
  );
}
