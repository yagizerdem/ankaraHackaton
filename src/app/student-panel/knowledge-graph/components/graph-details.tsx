"use client";

import { ArrowRightIcon, ClockIcon, FileTextIcon } from "lucide-react";

import { DIFFICULTY_STYLES } from "@/app/student-panel/knowledge-graph/graph-utils";
import { cn } from "@/lib/utils";

import type {
  GraphTopic,
  SelectedGraph,
} from "@/app/student-panel/knowledge-graph/data";

interface GraphDetailsProps {
  graph: SelectedGraph;
  selected: GraphTopic | null;
  prerequisites: string[];
  unlocks: string[];
  order: GraphTopic[];
  topicsById: Map<string, GraphTopic>;
  onSelect: (id: string) => void;
}

export function GraphDetails({
  graph,
  selected,
  prerequisites,
  unlocks,
  order,
  topicsById,
  onSelect,
}: GraphDetailsProps) {
  return (
    <aside
      aria-live="polite"
      className="flex max-h-[calc(60dvh+5.75rem)] min-h-0 flex-col overflow-y-auto rounded-xl bg-surface-container p-4"
    >
      {selected ? (
        <TopicDetails
          topic={selected}
          prerequisites={prerequisites}
          unlocks={unlocks}
          topicsById={topicsById}
          onSelect={onSelect}
        />
      ) : (
        <Overview graph={graph} order={order} onSelect={onSelect} />
      )}
    </aside>
  );
}

function Overview({
  graph,
  order,
  onSelect,
}: {
  graph: SelectedGraph;
  order: GraphTopic[];
  onSelect: (id: string) => void;
}) {
  const totalMinutes = graph.topics.reduce(
    (sum, topic) => sum + (topic.estimatedStudyMinutes ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-title-md text-on-surface">{graph.documentName}</h2>
        <p className="text-body-sm text-on-surface-variant">
          Select a topic to see what it needs and what it unlocks.
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-2">
        {[
          ["Topics", graph.topics.length],
          ["Links", graph.links.length],
          ["Hours", Math.round((totalMinutes / 60) * 10) / 10],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-surface-container-high p-2">
            <dt className="text-label-md text-on-surface-variant">{label}</dt>
            <dd className="text-headline-md text-on-surface tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-2">
        <h3 className="text-label-md text-on-surface">Suggested study order</h3>
        <p className="text-body-sm text-on-surface-variant">
          Every topic comes after its prerequisites.
        </p>
        <ol className="flex flex-col gap-1">
          {order.map((topic, index) => (
            // Each row selects the topic and centers it on the canvas.
            <li key={topic.id}>
              <button
                type="button"
                onClick={() => onSelect(topic.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors outline-none hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="w-5 shrink-0 text-right text-mono-data text-outline tabular-nums">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-body-sm text-on-surface">
                  {topic.label}
                </span>
                <span
                  title={DIFFICULTY_STYLES[topic.difficulty].label}
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    DIFFICULTY_STYLES[topic.difficulty].dot,
                  )}
                >
                  <span className="sr-only">
                    {DIFFICULTY_STYLES[topic.difficulty].label}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function TopicDetails({
  topic,
  prerequisites,
  unlocks,
  topicsById,
  onSelect,
}: {
  topic: GraphTopic;
  prerequisites: string[];
  unlocks: string[];
  topicsById: Map<string, GraphTopic>;
  onSelect: (id: string) => void;
}) {
  const style = DIFFICULTY_STYLES[topic.difficulty];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded px-1.5 py-px text-label-sm", style.chip)}>
            {style.label}
          </span>
          {topic.estimatedStudyMinutes != null && (
            <span className="flex items-center gap-1 text-mono-data text-on-surface-variant tabular-nums">
              <ClockIcon aria-hidden className="size-3.5" />
              {topic.estimatedStudyMinutes} min
            </span>
          )}
          {topic.sourcePages.length > 0 && (
            <span className="flex items-center gap-1 text-mono-data text-on-surface-variant tabular-nums">
              <FileTextIcon aria-hidden className="size-3.5" />
              {topic.sourcePages.length === 1 ? "Page" : "Pages"}{" "}
              {topic.sourcePages.join(", ")}
            </span>
          )}
        </div>
        <h2 className="text-title-md text-on-surface">{topic.label}</h2>
        <p className="text-body-sm text-on-surface-variant">{topic.description}</p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-label-md text-on-surface-variant">
          <span>Importance</span>
          <span className="text-mono-data tabular-nums">
            {Math.round(topic.importance * 100)}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-highest">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${topic.importance * 100}%` }}
          />
        </div>
      </div>

      <TopicLinks
        title="Learn these first"
        empty="No prerequisites. A good place to start."
        ids={prerequisites}
        topicsById={topicsById}
        onSelect={onSelect}
        accent="bg-tertiary"
      />
      <TopicLinks
        title="Unlocks"
        empty="Nothing builds on this topic yet."
        ids={unlocks}
        topicsById={topicsById}
        onSelect={onSelect}
        accent="bg-success"
      />

      <TextList title="Learning objectives" items={topic.learningObjectives} />
      <TextList title="Common misconceptions" items={topic.misconceptions} />

      {topic.keywords.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-label-md text-on-surface">Keywords</h3>
          <ul className="flex flex-wrap gap-1">
            {topic.keywords.map((keyword) => (
              <li
                key={keyword}
                className="rounded bg-surface-container-high px-1.5 py-0.5 text-mono-data text-on-surface-variant"
              >
                {keyword}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function TopicLinks({
  title,
  empty,
  ids,
  topicsById,
  onSelect,
  accent,
}: {
  title: string;
  empty: string;
  ids: string[];
  topicsById: Map<string, GraphTopic>;
  onSelect: (id: string) => void;
  accent: string;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-label-md text-on-surface">{title}</h3>
      {ids.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {ids.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect(id)}
                className="flex w-full items-center gap-2 rounded-lg bg-surface-container-high px-2 py-1.5 text-left text-body-sm text-on-surface transition-colors outline-none hover:bg-surface-bright focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", accent)} />
                <span className="min-w-0 flex-1 truncate">
                  {topicsById.get(id)?.label ?? "Unknown topic"}
                </span>
                <ArrowRightIcon aria-hidden className="size-3.5 text-outline" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TextList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-label-md text-on-surface">{title}</h3>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-body-sm text-on-surface-variant marker:text-outline">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
