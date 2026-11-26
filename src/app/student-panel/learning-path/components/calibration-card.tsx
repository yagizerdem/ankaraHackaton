import { GaugeIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Calibration } from "@/lib/learning/calibration";

const BAR: Record<string, string> = {
  sure: "bg-primary",
  unsure: "bg-tertiary",
  guess: "bg-outline",
};

/** How well the student's confidence matched their results. */
export function CalibrationCard({
  calibration,
  title = "Confidence check",
}: {
  calibration: Calibration;
  title?: string;
}) {
  const total = calibration.rows.reduce((sum, row) => sum + row.answers, 0);

  return (
    <section
      aria-labelledby="calibration-title"
      className="flex flex-col gap-4 rounded-xl bg-surface-container p-4 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2
          id="calibration-title"
          className="flex items-center gap-2 text-title-md text-on-surface"
        >
          <GaugeIcon aria-hidden className="size-5 text-primary" />
          {title}
        </h2>
        <p className="text-body-sm text-on-surface-variant">
          Before each answer you said how sure you were. This compares that
          with how you did.
        </p>
      </div>

      {total === 0 ? (
        <p className="text-body-sm text-on-surface-variant">
          Take an exam to see this. Each question asks how sure you are.
        </p>
      ) : (
        <>
          <dl className="flex flex-col gap-3">
            {calibration.rows.map((row) => (
              <div key={row.confidence} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-body-sm">
                  <dt className="text-on-surface">{row.label}</dt>
                  <dd className="text-mono-data text-on-surface-variant tabular-nums">
                    {row.accuracy === null
                      ? "No answers"
                      : `${Math.round(row.accuracy * 100)}% right · ${row.correct}/${row.answers}`}
                  </dd>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
                  <div
                    className={cn("h-full rounded-full", BAR[row.confidence])}
                    style={{ width: `${(row.accuracy ?? 0) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </dl>

          {calibration.insights.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {calibration.insights.map((insight) => (
                <li
                  key={insight}
                  className="rounded-lg bg-surface-container-high px-3 py-2 text-body-sm text-on-surface"
                >
                  {insight}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-sm text-on-surface-variant">
              Answer a few more questions at each confidence level for a
              clearer picture.
            </p>
          )}

          {calibration.confidentMistakes > 0 && (
            <p className="text-body-sm text-error">
              {calibration.confidentMistakes}{" "}
              {calibration.confidentMistakes === 1 ? "answer was" : "answers were"}{" "}
              wrong while you were sure. Those usually point to a
              misconception, so they move up in your learning path.
            </p>
          )}
        </>
      )}
    </section>
  );
}
