"use client";

import "@xyflow/react/dist/style.css";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dagre from "@dagrejs/dagre";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { NetworkIcon, TriangleAlertIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { DashboardData, DashboardTopic } from "@/app/student-panel/dashboard/data";
import type { MasteryStatus } from "@/lib/assessment/mastery";

const NODE_WIDTH = 180;
const NODE_HEIGHT = 56;

const STATUS: Record<
  MasteryStatus,
  { label: string; chip: string; dot: string; card: string; text: string }
> = {
  mastered: {
    label: "Mastered",
    chip: "bg-success/15 text-success",
    dot: "bg-success",
    card: "border-success/50",
    text: "text-success",
  },
  developing: {
    label: "Developing",
    chip: "bg-tertiary/15 text-tertiary",
    dot: "bg-tertiary",
    card: "border-tertiary/50",
    text: "text-tertiary",
  },
  weak: {
    label: "Needs work",
    chip: "bg-error/15 text-error",
    dot: "bg-error",
    card: "border-error/60 bg-error/10",
    text: "text-error",
  },
  unmeasured: {
    label: "No evidence",
    chip: "bg-surface-container-highest text-on-surface-variant",
    dot: "bg-outline",
    card: "border-outline-variant",
    text: "text-on-surface-variant",
  },
};

type TopicNodeData = { topic: DashboardTopic; dimmed: boolean };
type TopicFlowNode = Node<TopicNodeData, "topic">;

function TopicNode({ data }: NodeProps<TopicFlowNode>) {
  const { topic, dimmed } = data;
  const style = STATUS[topic.status];
  return (
    <div
      className={cn(
        "flex h-[56px] w-[180px] flex-col justify-center gap-0.5 rounded-lg border bg-surface-container-high px-2.5 transition-opacity motion-reduce:transition-none",
        style.card,
        dimmed && "opacity-25",
      )}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} className="!size-1 !min-h-0 !min-w-0 !border-0 !bg-outline" />
      <span className="line-clamp-1 text-label-md text-on-surface">{topic.label}</span>
      <span className={cn("flex items-center gap-1 text-mono-data text-[11px]", style.text)}>
        <span className={cn("size-1.5 rounded-full", style.dot)} />
        {topic.status === "unmeasured"
          ? `${topic.evidence}/3 answers`
          : `${Math.round(topic.mastery * 100)}% mastery`}
      </span>
      <Handle type="source" position={Position.Bottom} isConnectable={false} className="!size-1 !min-h-0 !min-w-0 !border-0 !bg-outline" />
    </div>
  );
}

const nodeTypes = { topic: TopicNode };

const timeFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export function GraphPreview({
  graph,
  graphId,
  documentName,
  diagnosis,
}: {
  graph: NonNullable<DashboardData["graph"]>;
  graphId: string;
  documentName: string;
  diagnosis: DashboardData["diagnosis"];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<MasteryStatus | null>(null);
  const [showDiagnosis, setShowDiagnosis] = useState(true);

  const positioned = useMemo(() => {
    const layout = new dagre.graphlib.Graph();
    layout.setGraph({ rankdir: "TB", nodesep: 24, ranksep: 48 });
    layout.setDefaultEdgeLabel(() => ({}));
    for (const topic of graph.topics) {
      layout.setNode(topic.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }
    for (const link of graph.links) layout.setEdge(link.source, link.target);
    dagre.layout(layout);
    return new Map(
      graph.topics.map((topic) => {
        const { x, y } = layout.node(topic.id);
        return [topic.id, { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 }];
      }),
    );
  }, [graph]);

  const statusOf = new Map(graph.topics.map((topic) => [topic.id, topic.status]));
  const counts = graph.topics.reduce<Record<MasteryStatus, number>>(
    (acc, topic) => ({ ...acc, [topic.status]: acc[topic.status] + 1 }),
    { mastered: 0, developing: 0, weak: 0, unmeasured: 0 },
  );

  const nodes: TopicFlowNode[] = graph.topics.map((topic) => ({
    id: topic.id,
    type: "topic",
    position: positioned.get(topic.id)!,
    data: { topic, dimmed: filter !== null && topic.status !== filter },
    draggable: false,
  }));

  const edges: Edge[] = graph.links.map((link) => {
    // A link out of a weak topic is where a gap spreads, so it's highlighted.
    const fromWeak = statusOf.get(link.source) === "weak";
    const color = fromWeak ? "var(--color-error)" : "var(--color-outline)";
    return {
      id: link.id,
      source: link.source,
      target: link.target,
      type: "smoothstep",
      focusable: false,
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
      style: {
        stroke: color,
        strokeWidth: fromWeak ? 2 : 1.25,
        opacity: filter ? 0.3 : 1,
      },
    };
  });

  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-xl bg-surface-container p-4 shadow-sm">
      <div className="flex flex-col items-start justify-between gap-2 border-b border-surface-container-highest pb-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1">
          <NetworkIcon aria-hidden className="size-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-title-md text-on-surface">Knowledge graph</h2>
            <p className="text-mono-data text-[11px] text-on-surface-variant">
              {documentName} · {graph.topics.length} topics · {graph.links.length} links
            </p>
          </div>
        </div>
        <Link
          href={`/student-panel/knowledge-graph?graph=${graphId}`}
          className="rounded-lg bg-surface-container-high px-3 py-1.5 text-label-md text-on-surface transition-colors outline-none hover:bg-surface-bright focus-visible:ring-2 focus-visible:ring-primary"
        >
          Open explorer
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="text-label-sm text-on-surface-variant">Filter:</span>
        {(Object.keys(STATUS) as MasteryStatus[]).map((status) => {
          const active = filter === status;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(active ? null : status)}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-label-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
                STATUS[status].chip,
                active && "ring-1 ring-current",
              )}
            >
              <span className={cn("size-1.5 rounded-full", STATUS[status].dot)} />
              {STATUS[status].label} ({counts[status]})
            </button>
          );
        })}
      </div>

      {diagnosis && showDiagnosis && diagnosis.tone !== "clear" && (
        <div className="flex items-start gap-2 rounded-xl bg-surface-container-high p-3">
          <TriangleAlertIcon
            aria-hidden
            className={cn(
              "mt-0.5 size-5 shrink-0",
              diagnosis.tone === "unmeasured" ? "text-tertiary" : "text-error",
            )}
          />
          <div className="flex flex-col gap-2">
            <p className="text-body-sm text-on-surface">
              <strong>Diagnosis: </strong>
              {diagnosis.text}
            </p>
            <div className="flex items-center gap-1">
              <Link
                href={`/student-panel/learning-path?graph=${graphId}`}
                className="rounded bg-primary px-2 py-1 text-label-sm text-on-primary transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
              >
                Plan my route
              </Link>
              <button
                type="button"
                onClick={() => setShowDiagnosis(false)}
                className="rounded bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant outline-none hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          "h-[420px] overflow-hidden rounded-xl",
          "[--xy-background-color:var(--color-surface-container-lowest)]",
          "[--xy-background-pattern-dots-color-default:var(--color-outline-variant)]",
          "[--xy-controls-button-background-color-default:var(--color-surface-container-high)]",
          "[--xy-controls-button-background-color-hover-default:var(--color-surface-bright)]",
          "[--xy-controls-button-color-default:var(--color-on-surface)]",
          "[--xy-controls-button-border-color-default:var(--color-outline-variant)]",
        )}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesConnectable={false}
          nodesDraggable={false}
          edgesFocusable={false}
          onNodeClick={() => router.push(`/student-panel/knowledge-graph?graph=${graphId}`)}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1 text-mono-data text-[11px] text-on-surface-variant">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            Cycle check: <strong className="text-success">0 cycles (acyclic)</strong>
          </span>
          <span aria-hidden>•</span>
          <span>
            Depth: <strong className="text-on-surface">{graph.depth} levels</strong>
          </span>
        </div>
        <span>Built {timeFormat.format(new Date(graph.createdAt))}</span>
      </div>
    </div>
  );
}
