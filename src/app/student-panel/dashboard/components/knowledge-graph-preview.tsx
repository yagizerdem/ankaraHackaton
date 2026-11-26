"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  BadgeCheckIcon,
  LockIcon,
  MaximizeIcon,
  NetworkIcon,
  TriangleAlertIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GRAPH_WORLD,
  knowledgeGraph,
  type GraphEdge,
  type GraphNode,
  type NodeStatus,
} from "@/app/student-panel/dashboard/mockdata";

// Nodes have a fixed height so edges can attach to their exact borders.
const NODE_HEIGHT = 76;
const ZOOM_STEP = 1.2;
const ZOOM_MIN = 0.6;
const ZOOM_MAX = 2;

/** "Locked / No evidence" covers both locked topics and ones with no evidence yet. */
function matchesFilter(status: NodeStatus, filter: NodeStatus | null) {
  if (!filter) return true;
  if (filter === "locked") return status === "locked" || status === "unmeasured";
  return status === filter;
}

export function KnowledgeGraphPreview({ onStartRoute }: { onStartRoute: () => void }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [filter, setFilter] = useState<NodeStatus | null>(null);
  const [showDiagnosis, setShowDiagnosis] = useState(true);

  // Shrink the fixed-size graph to fit narrow cards; zoom works on top of that.
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setFit(Math.min(1, (entry.contentRect.width - 32) / GRAPH_WORLD.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = fit * zoom;
  const { diagnosis, telemetry } = knowledgeGraph;

  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-xl bg-surface-container p-4 shadow-sm">
      <div className="flex flex-col items-start justify-between gap-1 border-b border-surface-container-highest pb-1 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1">
          <NetworkIcon className="size-5 shrink-0 text-primary" />
          <div>
            <h3 className="text-title-md text-on-surface">{knowledgeGraph.title}</h3>
            <p className="text-mono-data text-[11px] text-on-surface-variant">
              {knowledgeGraph.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-surface-container-low p-1">
          <ToolButton
            label="Zoom in"
            disabled={zoom >= ZOOM_MAX}
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z * ZOOM_STEP))}
          >
            <ZoomInIcon className="size-4" />
          </ToolButton>
          <ToolButton
            label="Zoom out"
            disabled={zoom <= ZOOM_MIN}
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z / ZOOM_STEP))}
          >
            <ZoomOutIcon className="size-4" />
          </ToolButton>
          <ToolButton label="Fit to view" onClick={() => setZoom(1)}>
            <MaximizeIcon className="size-4" />
          </ToolButton>
          <span className="mx-1 h-4 w-px bg-surface-container-highest" />
          <span className="rounded bg-surface-container px-1 py-0.5 text-mono-data text-[11px] text-success">
            22 Nodes
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <span className="text-label-sm text-on-surface-variant">Filter:</span>
        {knowledgeGraph.filters.map((chip) => {
          const active = filter === chip.status;
          return (
            <button
              key={chip.status}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(active ? null : chip.status)}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-label-sm transition-colors",
                chip.className,
                active && "ring-1 ring-current",
              )}
            >
              <span className={cn("size-1.5 rounded-full", chip.dotClassName)} />
              {chip.label}
            </button>
          );
        })}
      </div>

      {showDiagnosis && (
        <DiagnosisCard
          className="md:hidden"
          onStart={onStartRoute}
          onDismiss={() => setShowDiagnosis(false)}
        />
      )}

      <div className="relative">
        <div
          ref={viewport}
          className="overflow-auto rounded-xl bg-surface-container-lowest p-4 select-none"
          style={{ height: GRAPH_WORLD.height * fit + 32 }}
        >
          <div
            className="relative mx-auto"
            style={{ width: GRAPH_WORLD.width * scale, height: GRAPH_WORLD.height * scale }}
          >
            <div
              className="absolute top-0 left-0 origin-top-left transition-transform duration-200 motion-reduce:transition-none"
              style={{
                width: GRAPH_WORLD.width,
                height: GRAPH_WORLD.height,
                transform: `scale(${scale})`,
              }}
            >
              <GraphEdges />
              {knowledgeGraph.nodes.map((node) => (
                <GraphNodeCard
                  key={node.id}
                  node={node}
                  dimmed={!matchesFilter(node.status, filter)}
                />
              ))}
            </div>
          </div>
        </div>

        {showDiagnosis && (
          <DiagnosisCard
            className="absolute top-4 right-4 hidden max-w-sm md:block"
            onStart={onStartRoute}
            onDismiss={() => setShowDiagnosis(false)}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1 pt-1 text-mono-data text-[11px] text-on-surface-variant">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            Cycle check: <strong className="text-success">{telemetry.cycles}</strong>
          </span>
          <span aria-hidden>•</span>
          <span>
            Kahn topological depth: <strong className="text-on-surface">{telemetry.depth}</strong>
          </span>
        </div>
        <div>Last DAG sync: {telemetry.lastSync}</div>
      </div>

      <span className="sr-only">
        {diagnosis.title}: {diagnosis.text} {diagnosis.highlight}.
      </span>
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function DiagnosisCard({
  className,
  onStart,
  onDismiss,
}: {
  className?: string;
  onStart: () => void;
  onDismiss: () => void;
}) {
  const { diagnosis } = knowledgeGraph;
  return (
    <div
      className={cn(
        "z-20 rounded-xl bg-surface-container-high/95 p-2 shadow-xl backdrop-blur-md",
        className,
      )}
    >
      <div className="flex items-start gap-1">
        <TriangleAlertIcon className="mt-0.5 size-5 shrink-0 text-error" />
        <div className="flex flex-col gap-1">
          <div className="text-label-md font-semibold text-on-surface">{diagnosis.title}</div>
          <p className="text-body-sm text-on-surface-variant">
            <strong className="text-on-surface">{diagnosis.lead}</strong> {diagnosis.text}{" "}
            <span className="font-medium text-tertiary">{diagnosis.highlight}</span>.{" "}
            {diagnosis.tail}
          </p>
          <div className="mt-1 flex items-center gap-1">
            <button
              type="button"
              onClick={onStart}
              className="rounded bg-primary px-1.5 py-1 text-label-sm text-on-primary transition-colors hover:bg-primary/90"
            >
              {diagnosis.action}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded bg-surface-container px-1.5 py-1 text-label-sm text-on-surface-variant hover:text-on-surface"
            >
              {diagnosis.dismiss}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function edgeGeometry(edge: GraphEdge) {
  const nodes = knowledgeGraph.nodes as GraphNode[];
  const a = nodes.find((n) => n.id === edge.from)!;
  const b = nodes.find((n) => n.id === edge.to)!;

  // Same row: right side to left side, with the label above the nodes since
  // the gap between them is narrower than the text. Otherwise: bottom to top.
  if (Math.abs(a.y - b.y) < 20) {
    const y = a.y + NODE_HEIGHT / 2;
    const x1 = a.x + a.width;
    const x2 = b.x - 6;
    return {
      d: `M ${x1} ${y} L ${x2} ${y}`,
      labelX: (x1 + x2) / 2,
      labelY: Math.min(a.y, b.y) - 6,
      anchor: "middle" as const,
    };
  }
  const x1 = a.x + a.width / 2;
  const y1 = a.y + NODE_HEIGHT;
  const x2 = b.x + b.width / 2;
  const y2 = b.y - 6;
  const bend = (y2 - y1) / 2;
  return {
    d: `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`,
    labelX: (x1 + x2) / 2 + 8,
    labelY: (y1 + y2) / 2,
    anchor: "start" as const,
  };
}

function GraphEdges() {
  const id = useId();

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
      viewBox={`0 0 ${GRAPH_WORLD.width} ${GRAPH_WORLD.height}`}
    >
      <defs>
        <pattern id={`${id}-dots`} width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" style={{ fill: "var(--primary-fixed-dim)" }} />
        </pattern>
        {knowledgeGraph.edges.map((edge) => (
          <marker
            key={`${edge.from}-${edge.to}`}
            id={`${id}-arrow-${edge.from}-${edge.to}`}
            className={edge.className}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="currentColor" />
          </marker>
        ))}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-dots)`} opacity="0.35" />
      {knowledgeGraph.edges.map((edge) => {
        const { d, labelX, labelY, anchor } = edgeGeometry(edge);
        return (
          <g key={`${edge.from}-${edge.to}`} className={edge.className}>
            <path
              d={d}
              fill="none"
              markerEnd={`url(#${id}-arrow-${edge.from}-${edge.to})`}
              strokeDasharray={edge.dashed ? "4 3" : undefined}
              strokeWidth={edge.critical ? 2.5 : 2}
              stroke="currentColor"
            />
            {edge.label && (
              <text
                x={labelX}
                y={labelY}
                textAnchor={anchor}
                fontSize="10"
                fontWeight={edge.critical ? 600 : 500}
                fill="currentColor"
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function GraphNodeCard({ node, dimmed }: { node: GraphNode; dimmed: boolean }) {
  const style = {
    mastered: {
      card: "bg-surface-container-high/90 shadow-md",
      badge: "text-success",
      dot: "bg-success",
      title: "text-on-surface",
      detail: "text-on-surface-variant",
    },
    review: {
      card: "bg-surface-container-high/95 shadow-lg",
      badge: "text-tertiary",
      dot: "bg-tertiary",
      title: "text-on-surface",
      detail: "text-tertiary",
    },
    unmeasured: {
      card: "bg-surface-container-high/80 shadow-sm",
      badge: "text-on-surface-variant",
      dot: "bg-outline",
      title: "text-on-surface",
      detail: "text-on-surface-variant",
    },
    bottleneck: {
      card: "bg-error-container/60 shadow-xl ring-1 ring-error/40",
      badge: "text-error",
      dot: "bg-error",
      title: "font-semibold text-error",
      detail: "text-on-error-container",
    },
    locked: {
      card: "bg-surface-container-high/50 opacity-60 shadow-sm",
      badge: "text-outline",
      dot: "",
      title: "text-on-surface-variant",
      detail: "text-outline",
    },
  }[node.status];

  return (
    <div
      className={cn(
        "absolute z-10 flex flex-col justify-center rounded-xl p-2 backdrop-blur-sm transition-[opacity,transform] hover:scale-105 motion-reduce:transition-none",
        style.card,
        dimmed && "opacity-25",
      )}
      style={{ left: node.x, top: node.y, width: node.width, height: NODE_HEIGHT }}
    >
      <div className="mb-1 flex items-center justify-between gap-1">
        <span className={cn("inline-flex items-center gap-1 text-label-sm", style.badge)}>
          {node.status === "locked" ? (
            <LockIcon className="size-3.5" />
          ) : (
            <span className="relative flex size-2">
              {node.status === "bottleneck" && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-error opacity-75 motion-reduce:animate-none" />
              )}
              <span className={cn("relative inline-flex size-2 rounded-full", style.dot)} />
            </span>
          )}
          {node.badge}
        </span>
        {node.status === "mastered" ? (
          <BadgeCheckIcon className="size-4 text-success" />
        ) : node.status === "bottleneck" ? (
          <span className="rounded bg-error/20 px-1.5 py-0.5 text-label-sm text-error">{node.meta}</span>
        ) : (
          node.meta && (
            <span className="truncate text-mono-data text-[11px] text-on-surface-variant">{node.meta}</span>
          )
        )}
      </div>
      <div className={cn("truncate text-title-md", style.title)}>{node.title}</div>
      <div className={cn("flex items-center gap-1 truncate text-mono-data text-[10px]", style.detail)}>
        {node.status === "review" && <TriangleAlertIcon className="size-3 shrink-0" />}
        {node.detail}
      </div>
    </div>
  );
}
