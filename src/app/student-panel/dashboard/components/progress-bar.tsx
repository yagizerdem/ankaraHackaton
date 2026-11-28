import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percent: number;
  /** Fill color of the bar, e.g. "bg-success". */
  barClassName?: string;
  size?: "sm" | "md";
  pulse?: boolean;
  label?: string;
}

export function ProgressBar({ percent, barClassName, size = "md", pulse, label }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-container-highest",
        size === "sm" ? "h-1.5" : "h-2",
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-700",
          barClassName,
          pulse && "animate-pulse motion-reduce:animate-none",
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
