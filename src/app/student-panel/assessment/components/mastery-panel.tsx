import {
  MASTERY_STYLES,
  formatPercent,
} from "@/app/student-panel/assessment/mastery-styles";
import { cn } from "@/lib/utils";

import type { MasteryRow } from "@/app/student-panel/assessment/data";
import type { MasteryStatus } from "@/lib/assessment/mastery";

const LEGEND: MasteryStatus[] = ["mastered", "developing", "weak", "unmeasured"];

/** The student's mastery of every topic in the selected graph. */
export function MasteryPanel({ rows }: { rows: MasteryRow[] }) {
  const measured = rows.filter((row) => row.status !== "unmeasured").length;

  return (
    <section
      aria-labelledby="mastery-title"
      className="flex flex-col gap-4 rounded-xl bg-surface-container p-4 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id="mastery-title" className="text-title-md text-on-surface">
          Your mastery
        </h2>
        <p className="text-body-sm text-on-surface-variant">
          {measured} of {rows.length} topics measured. A topic needs 3 answers
          before it gets a status.
        </p>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {LEGEND.map((status) => (
          <li
            key={status}
            className="flex items-center gap-1.5 text-body-sm text-on-surface-variant"
          >
            <span aria-hidden className={cn("size-2 rounded-full", MASTERY_STYLES[status].dot)} />
            {MASTERY_STYLES[status].label}
          </li>
        ))}
      </ul>

      <ol className="flex max-h-[28rem] flex-col gap-1 overflow-y-auto pr-1">
        {rows.map((row) => {
          const style = MASTERY_STYLES[row.status];
          return (
            <li
              key={row.topicId}
              className="flex flex-col gap-1 rounded-lg px-2 py-1.5 hover:bg-surface-container-high"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-body-sm text-on-surface">
                  {row.label}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-px text-label-sm whitespace-nowrap",
                    style.chip,
                  )}
                >
                  {row.status === "unmeasured"
                    ? `${row.evidence}/3 answers`
                    : `${formatPercent(row.mastery)} · ${row.evidence} answers`}
                </span>
              </div>
              <div
                role="meter"
                aria-label={`${row.label} mastery`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(row.mastery * 100)}
                aria-valuetext={
                  row.status === "unmeasured"
                    ? "Not enough evidence"
                    : `${formatPercent(row.mastery)}, ${style.label}`
                }
                className="h-1 overflow-hidden rounded-full bg-surface-container-highest"
              >
                {row.evidence > 0 && (
                  <div
                    className={cn("h-full rounded-full", style.bar)}
                    style={{ width: `${row.mastery * 100}%` }}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
