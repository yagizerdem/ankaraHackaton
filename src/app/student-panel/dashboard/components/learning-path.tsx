import Link from "next/link";
import { CircleAlertIcon, SplitIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { DashboardData } from "@/app/student-panel/dashboard/data";
import type { StepAction } from "@/lib/learning/path";

const SHOWN_STEPS = 3;

const ACTIONS: Record<StepAction, { label: string; chip: string; cta: string; exam: boolean }> = {
  fix: { label: "Fix a misconception", chip: "bg-error/15 text-error", cta: "Review", exam: false },
  test: { label: "Quick test", chip: "bg-surface-container-highest text-on-surface-variant", cta: "Take a test", exam: true },
  study: { label: "Study and retest", chip: "bg-tertiary/15 text-tertiary", cta: "Review", exam: false },
  goal: { label: "Goal topic", chip: "bg-primary/15 text-primary", cta: "Take a test", exam: true },
};

/** The next steps of the student's goal route, from the learning path. */
export function LearningPath({ data }: { data: DashboardData }) {
  const graphQuery = data.selectedGraphId ? `?graph=${data.selectedGraphId}` : "";
  const steps = data.path?.steps.slice(0, SHOWN_STEPS) ?? [];

  return (
    <section
      id="learning-path"
      aria-labelledby="learning-path-title"
      className="flex scroll-mt-20 flex-col gap-4 rounded-xl bg-surface-container p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <SplitIcon aria-hidden className="size-5 shrink-0 text-tertiary" />
          <h2 id="learning-path-title" className="text-title-md text-on-surface">
            {data.path ? `Route to ${data.path.target}` : "Your learning path"}
          </h2>
        </div>
        <Link
          href={`/student-panel/learning-path${graphQuery}`}
          className="shrink-0 rounded text-label-md text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary"
        >
          {data.path ? "Full route" : "Set a goal"}
        </Link>
      </div>

      {!data.path ? (
        <p className="text-body-sm text-on-surface-variant">
          Pick a goal topic and your exam date. Your route will order its
          prerequisites, skip what you&apos;ve mastered and split the rest
          across the days you have.
        </p>
      ) : steps.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">
          You&apos;ve mastered {data.path.target} and everything it needs.
          Take a final exam to confirm.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {steps.map((step, index) => {
            const action = ACTIONS[step.action];
            return (
              <li
                key={step.topicId}
                className="flex flex-col gap-1 rounded-xl bg-surface-container-high p-2 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-0.5 text-label-sm",
                      action.chip,
                    )}
                  >
                    {step.action === "fix" && <CircleAlertIcon aria-hidden className="size-3" />}
                    Step {index + 1} · {action.label}
                  </span>
                  <span className="shrink-0 text-mono-data text-[11px] text-on-surface-variant">
                    {step.minutes} min
                  </span>
                </div>
                <div className="text-label-md font-semibold text-on-surface">{step.label}</div>
                <p className="text-body-sm text-on-surface-variant">{step.reason}</p>
                <Link
                  href={`${action.exam ? "/student-panel/assessment" : "/student-panel/knowledge-graph"}${graphQuery}`}
                  className={cn(
                    "mt-1 self-start rounded-lg px-2 py-1 text-label-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    index === 0
                      ? "bg-primary text-on-primary hover:bg-primary/90"
                      : "bg-surface-container-highest text-on-surface hover:bg-surface-bright",
                  )}
                >
                  {action.cta}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
