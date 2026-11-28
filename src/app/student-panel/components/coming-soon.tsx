import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  /** What the section will do, shown in the empty state. */
  plan: string;
}

/** Placeholder for panel sections that aren't built yet. */
export function ComingSoon({ title, description, icon: Icon, plan }: ComingSoonProps) {
  return (
    <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
          {title}
        </h1>
        <p className="text-body-md text-on-surface-variant">{description}</p>
      </header>

      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center">
        <Icon aria-hidden className="size-7 text-on-surface-variant" />
        <p className="text-title-md text-on-surface">Not available yet</p>
        <p className="max-w-md text-body-sm text-on-surface-variant">{plan}</p>
      </div>
    </div>
  );
}
