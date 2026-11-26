import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { statCards, type StatCard, type StatFooter, type Tone } from "../mockdata";
import { ProgressBar } from "./progress-bar";
import { toneSoft, toneText } from "./tones";

export function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {statCards.map((card) => (
        <StatCardItem key={card.id} card={card} />
      ))}
    </div>
  );
}

function StatCardItem({ card }: { card: StatCard }) {
  const Icon = card.icon;
  // The document count is a neutral fact, not a signal, so it stays in ink.
  const valueTone = card.tone === "primary" ? "text-on-surface" : toneText[card.tone];
  const detailTone = card.tone === "primary" ? "text-on-surface-variant" : toneText[card.tone];

  return (
    <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-xl bg-surface-container p-4 shadow-sm transition-colors hover:bg-surface-container-high">
      {card.tone === "error" && (
        <div className="pointer-events-none absolute top-0 right-0 size-24 rounded-bl-full bg-error/10" />
      )}
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-label-sm tracking-wider text-on-surface-variant uppercase">
            {card.label}
          </span>
          <div className="flex flex-wrap items-baseline gap-1">
            <span className={cn("text-headline-xl font-bold", valueTone)}>{card.value}</span>
            <span className={cn("text-mono-data", detailTone)}>{card.detail}</span>
          </div>
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            card.tone === "primary" ? "bg-primary-container/20" : toneSoft[card.tone],
            toneText[card.tone],
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      <StatCardFooter footer={card.footer} tone={card.tone} />
    </div>
  );
}

function StatCardFooter({ footer, tone }: { footer: StatFooter; tone: Tone }) {
  switch (footer.kind) {
    case "progress":
      return (
        <div className="flex flex-col gap-1.5">
          <ProgressBar percent={footer.percent} tone={tone} />
          <div className="flex items-center justify-between text-mono-data text-[11px] text-on-surface-variant">
            <span>{footer.left}</span>
            <span className="text-on-surface">{footer.right}</span>
          </div>
        </div>
      );
    case "callout":
      return (
        <div className="flex items-center gap-1 rounded-lg bg-error/10 p-1">
          <ArrowRightIcon className="size-4 shrink-0 text-error" />
          <span className="truncate text-label-md text-error">{footer.text}</span>
        </div>
      );
    case "split":
      return (
        <div className="flex items-center justify-between text-mono-data text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" />
            {footer.left}
          </span>
          <span className="font-medium text-primary">{footer.right}</span>
        </div>
      );
    case "progress-caption":
      return (
        <div className="flex flex-col gap-1.5">
          <ProgressBar percent={footer.percent} tone={tone} />
          <div className="truncate text-label-sm text-on-surface-variant">
            {footer.caption}{" "}
            <span className="font-medium text-on-surface">{footer.highlight}</span>
          </div>
        </div>
      );
  }
}
