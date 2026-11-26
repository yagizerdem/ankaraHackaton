import Link from "next/link";
import {
  ArrowRightIcon,
  FileTextIcon,
  RouteIcon,
  TrendingUpIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react";

import { ProgressBar } from "@/app/student-panel/dashboard/components/progress-bar";
import { cn } from "@/lib/utils";

import type { DashboardData } from "@/app/student-panel/dashboard/data";

type StatFooter =
  | { kind: "progress"; percent: number; left: string; right: string }
  | { kind: "callout"; text: string; href?: string }
  | { kind: "split"; left: string; right: string }
  | { kind: "progress-caption"; percent: number; caption: string; highlight: string };

interface StatCard {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  valueClassName: string;
  detailClassName: string;
  iconClassName: string;
  /** Fill color of the footer progress bar. */
  barClassName?: string;
  /** Marks the card as an alert with a tinted corner. */
  alert?: boolean;
  footer: StatFooter;
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function buildCards(data: DashboardData): StatCard[] {
  const { overall, bottleneck, documents, path } = data;
  const graphQuery = data.selectedGraphId ? `?graph=${data.selectedGraphId}` : "";

  // Change between the last two finished exams, in percentage points.
  const change =
    overall.lastExam !== null && overall.previousExam !== null
      ? Math.round((overall.lastExam - overall.previousExam) * 100)
      : null;

  // Same thresholds as a topic's status: 80% mastered, 50% developing.
  const tone =
    overall.mastery === null
      ? { text: "text-on-surface", icon: "bg-surface-container-highest text-on-surface-variant", bar: "bg-outline" }
      : overall.mastery >= 0.8
        ? { text: "text-success", icon: "bg-success/15 text-success", bar: "bg-success" }
        : overall.mastery >= 0.5
          ? { text: "text-tertiary", icon: "bg-tertiary/15 text-tertiary", bar: "bg-tertiary" }
          : { text: "text-error", icon: "bg-error/15 text-error", bar: "bg-error" };

  return [
    {
      id: "mastery",
      label: "Overall topic mastery",
      value: overall.mastery === null ? "—" : percent(overall.mastery),
      detail:
        change !== null
          ? `${change >= 0 ? "+" : ""}${change} pts vs previous exam`
          : overall.lastExam !== null
            ? `Last exam ${percent(overall.lastExam)}`
            : "No exams yet",
      icon: TrendingUpIcon,
      valueClassName: tone.text,
      detailClassName:
        change === null
          ? "text-on-surface-variant"
          : change < 0
            ? "text-error"
            : "text-success",
      iconClassName: tone.icon,
      barClassName: tone.bar,
      footer: {
        kind: "progress",
        percent: Math.round((overall.mastery ?? 0) * 100),
        left: `${overall.correct} correct / ${overall.incorrect} wrong`,
        right: `${overall.measured}/${overall.topicCount} topics measured`,
      },
    },
    bottleneck
      ? {
          id: "gap",
          label: "Critical knowledge gap",
          value: bottleneck.topic,
          detail:
            bottleneck.blocks > 0
              ? `Blocks ${bottleneck.blocks} ${bottleneck.blocks === 1 ? "topic" : "topics"}`
              : "Weakest topic",
          icon: TriangleAlertIcon,
          valueClassName: "text-error text-title-md",
          detailClassName: "text-error",
          iconClassName: "bg-error/15 text-error",
          alert: true,
          footer: {
            kind: "callout",
            text:
              bottleneck.rootCause === bottleneck.topic
                ? `Practise ${bottleneck.topic}`
                : `Root cause: ${bottleneck.rootCause}`,
            href: `/student-panel/learning-path${graphQuery}`,
          },
        }
      : {
          id: "gap",
          label: "Critical knowledge gap",
          value: "None found",
          detail: overall.measured ? "No weak topics" : "Not measured yet",
          icon: TriangleAlertIcon,
          // Words, not a number, so they take the smaller headline size.
          valueClassName: "text-headline-md text-on-surface",
          detailClassName: "text-on-surface-variant",
          iconClassName: "bg-surface-container-highest text-on-surface-variant",
          footer: {
            kind: "callout",
            text: overall.measured ? "Keep testing new topics" : "Take an exam to find gaps",
            href: `/student-panel/assessment${graphQuery}`,
          },
        },
    {
      id: "documents",
      label: "Processed documents",
      value: String(documents.count),
      detail: `${documents.pages} ${documents.pages === 1 ? "page" : "pages"}`,
      icon: FileTextIcon,
      // The document count is a neutral fact, not a signal, so it stays in ink.
      valueClassName: "text-on-surface",
      detailClassName: "text-on-surface-variant",
      iconClassName: "bg-primary-container/20 text-primary",
      footer: {
        kind: "split",
        left: `${documents.topics} topics`,
        right: `${documents.links} prerequisite links`,
      },
    },
    path
      ? {
          id: "path",
          label: "Learning path progress",
          value: `${path.done}/${path.total}`,
          detail: `${path.total ? Math.round((path.done / path.total) * 100) : 0}% ready for ${path.target}`,
          icon: RouteIcon,
          valueClassName: "text-tertiary",
          detailClassName: "text-tertiary",
          iconClassName: "bg-tertiary/15 text-tertiary",
          barClassName: "bg-tertiary",
          footer: {
            kind: "progress-caption",
            percent: path.total ? Math.round((path.done / path.total) * 100) : 0,
            caption: path.next ? "Next:" : "Done:",
            highlight: path.next?.label ?? "every prerequisite is mastered",
          },
        }
      : {
          id: "path",
          label: "Learning path progress",
          value: "No goal",
          detail: "Set a goal and exam date",
          icon: RouteIcon,
          valueClassName: "text-headline-md text-on-surface",
          detailClassName: "text-on-surface-variant",
          iconClassName: "bg-tertiary/15 text-tertiary",
          footer: {
            kind: "callout",
            text: "Build your route",
            href: `/student-panel/learning-path${graphQuery}`,
          },
        },
  ];
}

export function StatCards({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {buildCards(data).map((card) => (
        <StatCardItem key={card.id} card={card} />
      ))}
    </div>
  );
}

function StatCardItem({ card }: { card: StatCard }) {
  const Icon = card.icon;

  return (
    <div className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-xl bg-surface-container p-4 shadow-sm transition-colors hover:bg-surface-container-high">
      {card.alert && (
        <div className="pointer-events-none absolute top-0 right-0 size-24 rounded-bl-full bg-error/10" />
      )}
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-label-md text-on-surface-variant">{card.label}</span>
          <span className={cn("text-headline-xl font-bold", card.valueClassName)}>
            {card.value}
          </span>
          <span className={cn("text-mono-data", card.detailClassName)}>{card.detail}</span>
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            card.iconClassName,
          )}
        >
          <Icon aria-hidden className="size-5" />
        </div>
      </div>
      <StatCardFooter footer={card.footer} barClassName={card.barClassName} />
    </div>
  );
}

function StatCardFooter({ footer, barClassName }: { footer: StatFooter; barClassName?: string }) {
  switch (footer.kind) {
    case "progress":
      return (
        <div className="flex flex-col gap-1.5">
          <ProgressBar percent={footer.percent} barClassName={barClassName} />
          <div className="flex items-center justify-between gap-2 text-mono-data text-[11px] text-on-surface-variant">
            <span>{footer.left}</span>
            <span className="text-on-surface">{footer.right}</span>
          </div>
        </div>
      );
    case "callout": {
      const content = (
        <>
          <ArrowRightIcon aria-hidden className="size-4 shrink-0" />
          <span className="truncate text-label-md">{footer.text}</span>
        </>
      );
      const className =
        "flex items-center gap-1 rounded-lg bg-surface-container-high p-1 text-on-surface transition-colors outline-none hover:bg-surface-bright focus-visible:ring-2 focus-visible:ring-primary";
      return footer.href ? (
        <Link href={footer.href} className={className}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      );
    }
    case "split":
      return (
        <div className="flex items-center justify-between gap-2 text-mono-data text-on-surface-variant">
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
          <ProgressBar percent={footer.percent} barClassName={barClassName} />
          <div className="truncate text-label-sm text-on-surface-variant">
            {footer.caption}{" "}
            <span className="font-medium text-on-surface">{footer.highlight}</span>
          </div>
        </div>
      );
  }
}
