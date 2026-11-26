import { BotIcon, CircleAlertIcon, ClipboardCheckIcon, SplitIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { learningPath, type LearningStep } from "../mockdata";

export function LearningPath() {
  return (
    <section
      id="learning-path"
      aria-labelledby="learning-path-title"
      className="flex scroll-mt-20 flex-col gap-4 rounded-xl bg-surface-container p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <SplitIcon className="size-5 shrink-0 text-tertiary" />
          <h3 id="learning-path-title" className="text-title-md text-on-surface">
            {learningPath.title}
          </h3>
        </div>
        <span className="shrink-0 rounded bg-tertiary/15 px-1.5 py-0.5 text-mono-data text-[11px] text-tertiary">
          {learningPath.tag}
        </span>
      </div>

      <ol className="flex flex-col gap-2">
        {learningPath.steps.map((step) => (
          <LearningStepCard key={step.id} step={step} />
        ))}
      </ol>
    </section>
  );
}

function LearningStepCard({ step }: { step: LearningStep }) {
  const ActionIcon =
    step.action.icon === "tutor" ? BotIcon : step.action.icon === "quiz" ? ClipboardCheckIcon : null;

  return (
    <li
      className={cn(
        "flex flex-col gap-1 rounded-xl p-2",
        step.locked
          ? "bg-surface-container-high/60"
          : "bg-surface-container-high shadow-sm transition-colors hover:bg-surface-bright",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-label-sm",
            step.badgeClassName,
          )}
        >
          {step.urgent && <CircleAlertIcon className="size-3" />}
          {step.badge}
        </span>
        <span
          className={cn(
            "shrink-0 text-mono-data text-[11px]",
            step.metaClassName,
          )}
        >
          {step.meta}
        </span>
      </div>
      <div
        className={cn(
          "text-label-md",
          step.locked ? "font-medium text-on-surface-variant" : "font-semibold text-on-surface",
        )}
      >
        {step.title}
      </div>
      {step.description && (
        <p className="text-body-sm text-on-surface-variant">{step.description}</p>
      )}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          disabled={step.locked}
          className={cn(
            "flex items-center gap-1 rounded-lg px-2 py-1 text-label-sm transition-colors",
            step.locked
              ? "cursor-not-allowed bg-surface-container-highest text-outline opacity-60"
              : step.action.variant === "primary"
                ? "bg-primary text-on-primary hover:bg-primary/90"
                : "bg-surface-container-highest text-on-surface hover:bg-surface-bright",
          )}
        >
          {ActionIcon && <ActionIcon className="size-4" />}
          {step.action.label}
        </button>
        <span
          className={cn(
            "text-mono-data text-[11px]",
            step.locked ? "text-outline" : "text-on-surface-variant",
          )}
        >
          {step.duration}
        </span>
      </div>
    </li>
  );
}
