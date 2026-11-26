import { cn } from "@/lib/utils";
import { activeCourse, student, welcomeBanner } from "@/app/student-panel/dashboard/mockdata";

export function WelcomeBanner() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-6 shadow-sm">
      <div className="pointer-events-none absolute -top-16 -right-16 size-80 rounded-full bg-primary-container/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 size-64 rounded-full bg-secondary-container/10 blur-2xl" />
      <div className="relative flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex max-w-3xl flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1">
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-mono-data tracking-wider text-primary uppercase">
              {welcomeBanner.cycleLabel}
            </span>
            <span className="relative ml-1 flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex size-1.5 rounded-full bg-success" />
            </span>
            <span className="text-label-sm text-success">{welcomeBanner.liveLabel}</span>
          </div>
          <h1 className="text-headline-xl-mobile text-on-surface sm:text-headline-lg">
            Welcome, {student.firstName}! Your personalized learning loop for{" "}
            <span className="font-normal text-primary">{activeCourse.name}</span> is active.
          </h1>
          <p className="text-body-md text-on-surface-variant">{welcomeBanner.summary}</p>
        </div>
        <ul className="flex flex-wrap items-center gap-1">
          {welcomeBanner.engines.map((engine) => {
            const Icon = engine.icon;
            return (
              <li
                key={engine.label}
                className="flex items-center gap-1 rounded-lg bg-surface-container px-2 py-1.5 text-mono-data text-on-surface-variant"
              >
                <Icon className={cn("size-4", engine.iconClassName)} />
                {engine.label}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
