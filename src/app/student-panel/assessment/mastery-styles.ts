import type { MasteryStatus } from "@/lib/assessment/mastery";

/** Gray / green / amber / red, per the spec's mastery table. */
export const MASTERY_STYLES: Record<
  MasteryStatus,
  { label: string; chip: string; bar: string; dot: string }
> = {
  unmeasured: {
    label: "Not enough evidence",
    chip: "bg-surface-container-highest text-on-surface-variant",
    bar: "bg-outline",
    dot: "bg-outline",
  },
  mastered: {
    label: "Mastered",
    chip: "bg-success/15 text-success",
    bar: "bg-success",
    dot: "bg-success",
  },
  developing: {
    label: "Developing",
    chip: "bg-tertiary/15 text-tertiary",
    bar: "bg-tertiary",
    dot: "bg-tertiary",
  },
  weak: {
    label: "Needs work",
    chip: "bg-error/15 text-error",
    bar: "bg-error",
    dot: "bg-error",
  },
};

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
