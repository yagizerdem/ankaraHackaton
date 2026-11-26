import Link from "next/link";
import {
  BookOpenIcon,
  ClipboardCheckIcon,
  FlagIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { LearningPath, StepAction } from "@/lib/learning/path";

const ACTIONS: Record<
  StepAction,
  { label: string; icon: LucideIcon; chip: string; cta: string }
> = {
  fix: {
    label: "Fix a misconception",
    icon: TriangleAlertIcon,
    chip: "bg-error/15 text-error",
    cta: "Review topic",
  },
  test: {
    label: "Quick test",
    icon: ClipboardCheckIcon,
    chip: "bg-surface-container-highest text-on-surface-variant",
    cta: "Take a test",
  },
  study: {
    label: "Study and retest",
    icon: BookOpenIcon,
    chip: "bg-tertiary/15 text-tertiary",
    cta: "Review topic",
  },
  goal: {
    label: "Goal topic",
    icon: FlagIcon,
    chip: "bg-primary/15 text-primary",
    cta: "Take a test",
  },
};

const dayFormat = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

/**
 * The route split across days. With `interactive`, each step links to where
 * the student acts on it; the teacher's report shows it read-only.
 */
export function PathDays({
  path,
  graphId,
  interactive = true,
}: {
  path: LearningPath;
  graphId: string;
  interactive?: boolean;
}) {
  const totalSteps = path.days.reduce((sum, day) => sum + day.steps.length, 0);

  return (
    <section
      aria-labelledby="route-title"
      className="flex flex-col gap-4 rounded-xl bg-surface-container p-4 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id="route-title" className="text-title-md text-on-surface">
          Route to {path.targetLabel}
        </h2>
        <p className="text-body-sm text-on-surface-variant">
          {totalSteps === 0
            ? `You've mastered ${path.targetLabel} and everything it needs. Take a final exam to confirm.`
            : `${totalSteps} ${totalSteps === 1 ? "step" : "steps"} over ${path.days.length} ${path.days.length === 1 ? "day" : "days"}, with ${path.daysLeft} ${path.daysLeft === 1 ? "day" : "days"} until your exam. It updates as your exam results come in.`}
        </p>
      </div>

      <ol className="flex flex-col gap-4">
        {path.days.map((day) => (
          <li key={day.day} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2 border-b border-surface-container-highest pb-1">
              <h3 className="text-label-md text-on-surface">
                Day {day.day}
                <span className="ml-2 text-on-surface-variant">
                  {dayFormat.format(new Date(`${day.date}T12:00:00Z`))}
                </span>
              </h3>
              <span className="text-mono-data text-on-surface-variant tabular-nums">
                {formatMinutes(day.minutes)}
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {day.steps.map((step) => {
                const action = ACTIONS[step.action];
                const Icon = action.icon;
                const href =
                  step.action === "test" || step.action === "goal"
                    ? `/student-panel/assessment?graph=${graphId}`
                    : `/student-panel/knowledge-graph?graph=${graphId}`;
                return (
                  <li
                    key={step.topicId}
                    className="flex flex-col gap-2 rounded-lg bg-surface-container-high p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-label-md text-on-surface">{step.label}</span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded px-1.5 py-px text-label-sm",
                            action.chip,
                          )}
                        >
                          <Icon aria-hidden className="size-3" />
                          {action.label}
                        </span>
                        <span className="text-mono-data text-on-surface-variant tabular-nums">
                          {formatMinutes(step.minutes)}
                        </span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant">{step.reason}</p>
                    </div>
                    {interactive && (
                      <Link
                        href={href}
                        className="shrink-0 self-start rounded-lg border border-outline-variant px-3 py-1.5 text-label-md text-on-surface transition-colors outline-none hover:bg-surface-container-highest focus-visible:ring-2 focus-visible:ring-primary sm:self-center"
                      >
                        {action.cta}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>

      {path.skipped.length > 0 && (
        <p className="text-body-sm text-on-surface-variant">
          Skipped because you&apos;ve mastered them:{" "}
          {path.skipped.map((topic) => topic.label).join(", ")}.
        </p>
      )}
    </section>
  );
}
