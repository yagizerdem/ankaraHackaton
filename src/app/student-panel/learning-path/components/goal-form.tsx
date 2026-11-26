"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon, TargetIcon } from "lucide-react";
import { toast } from "sonner";

import { clearGoal, saveGoal } from "@/app/student-panel/learning-path/api";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-60 aria-invalid:border-error";

interface GoalFormProps {
  graphId: string;
  topics: { id: string; label: string }[];
  goal: { targetTopicId: string; examDate: string } | null;
  /** yyyy-mm-dd bounds for the date picker. */
  minDate: string;
  maxDate: string;
}

export function GoalForm({ graphId, topics, goal, minDate, maxDate }: GoalFormProps) {
  const router = useRouter();
  const [targetTopicId, setTargetTopicId] = useState(goal?.targetTopicId ?? "");
  const [examDate, setExamDate] = useState(goal?.examDate ?? "");
  const [pending, setPending] = useState<"save" | "clear" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("save");
    setErrors({});
    const response = await saveGoal({ graphId, targetTopicId, examDate });
    setPending(null);

    if (!response.isSuccess) {
      setErrors(response.fromErrors ?? {});
      toast.error(response.message ?? "Couldn't save the goal");
      return;
    }
    toast.success("Goal saved. Your route is ready.");
    router.refresh();
  }

  async function onClear() {
    setPending("clear");
    const response = await clearGoal(graphId);
    setPending(null);
    if (!response.isSuccess) {
      toast.error(response.message ?? "Couldn't clear the goal");
      return;
    }
    setTargetTopicId("");
    setExamDate("");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-xl bg-surface-container p-4 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-title-md text-on-surface">
          <TargetIcon aria-hidden className="size-5 text-primary" />
          Your goal
        </h2>
        <p className="text-body-sm text-on-surface-variant">
          Pick the topic you need and when your exam is. The route below orders
          its prerequisites and splits them across the days you have.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="goal-topic" className="text-label-md text-on-surface">
            Goal topic
          </label>
          <select
            id="goal-topic"
            value={targetTopicId}
            onChange={(event) => setTargetTopicId(event.target.value)}
            disabled={pending !== null}
            aria-invalid={Boolean(errors.targetTopicId)}
            aria-describedby={errors.targetTopicId ? "goal-topic-error" : undefined}
            className={fieldClass}
          >
            <option value="" disabled>
              Choose a topic
            </option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.label}
              </option>
            ))}
          </select>
          {errors.targetTopicId && (
            <p id="goal-topic-error" className="text-body-sm text-error">
              {errors.targetTopicId}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="goal-date" className="text-label-md text-on-surface">
            Exam date
          </label>
          <input
            id="goal-date"
            type="date"
            value={examDate}
            min={minDate}
            max={maxDate}
            onChange={(event) => setExamDate(event.target.value)}
            disabled={pending !== null}
            aria-invalid={Boolean(errors.examDate)}
            aria-describedby={errors.examDate ? "goal-date-error" : undefined}
            className={cn(fieldClass, "[color-scheme:light] dark:[color-scheme:dark]")}
          />
          {errors.examDate && (
            <p id="goal-date-error" className="text-body-sm text-error">
              {errors.examDate}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {goal && (
          <button
            type="button"
            onClick={onClear}
            disabled={pending !== null}
            className="rounded-lg px-4 py-2 text-label-md text-on-surface-variant transition-colors outline-none hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
          >
            {pending === "clear" ? "Clearing..." : "Clear goal"}
          </button>
        )}
        <button
          type="submit"
          disabled={pending !== null || !targetTopicId || !examDate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === "save" && (
            <LoaderCircleIcon aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
          )}
          {goal ? "Update route" : "Build my route"}
        </button>
      </div>
    </form>
  );
}
