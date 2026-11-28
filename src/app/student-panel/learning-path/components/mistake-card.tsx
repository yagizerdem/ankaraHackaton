import { RepeatIcon } from "lucide-react";

import type { MistakePattern } from "@/lib/learning/report";

/**
 * The misconception behind the most wrong answers. A mistake is only called
 * out once it repeats; single ones are listed quietly.
 */
export function MistakeCard({ mistakes }: { mistakes: MistakePattern[] }) {
  const repeated = mistakes.filter((mistake) => mistake.count >= 2);
  const [top, ...others] = repeated;
  const singles = mistakes.filter((mistake) => mistake.count === 1);

  return (
    <section
      aria-labelledby="mistake-title"
      className="flex flex-col gap-3 rounded-xl bg-surface-container p-4 sm:p-6"
    >
      <h2
        id="mistake-title"
        className="flex items-center gap-2 text-title-md text-on-surface"
      >
        <RepeatIcon aria-hidden className="size-5 text-error" />
        Most common mistake
      </h2>

      {mistakes.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">
          No mistakes to report yet. When you pick a wrong answer, we note the
          misconception behind it and show the one that comes up most.
        </p>
      ) : top ? (
        <div className="flex flex-col gap-1 rounded-lg border border-error/30 bg-error/5 p-3">
          <p className="text-label-md text-error">
            You made this mistake {top.count} times
            {top.confident > 0 &&
              ` (sure of your answer ${top.confident === 1 ? "once" : `${top.confident} times`})`}
          </p>
          <p className="text-body-md text-on-surface">{top.misconception}</p>
          <p className="text-body-sm text-on-surface-variant">
            In {top.topics.join(", ")}
          </p>
        </div>
      ) : (
        <p className="text-body-sm text-on-surface-variant">
          No mistake has repeated yet. These came up once:
        </p>
      )}

      {[...others, ...singles].length > 0 && (
        <ul className="flex flex-col gap-1">
          {[...others, ...singles].slice(0, top ? 3 : 4).map((mistake) => (
            <li
              key={mistake.misconception}
              className="flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 text-body-sm"
            >
              <span className="text-on-surface">{mistake.misconception}</span>
              <span className="shrink-0 text-mono-data text-on-surface-variant tabular-nums">
                {mistake.count}×
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
