"use client";

import "@xyflow/react/dist/style.css";

import { useEffect, useMemo, useState } from "react";
import dagre from "@dagrejs/dagre";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ClockIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";

import { GraphDetails } from "@/app/student-panel/knowledge-graph/components/graph-details";
import {
  DIFFICULTIES,
  DIFFICULTY_STYLES,
  studyOrder,
} from "@/app/student-panel/knowledge-graph/graph-utils";
import { cn } from "@/lib/utils";

import type {
  Difficulty,
  GraphLink,
  GraphTopic,
  SelectedGraph,
} from "@/app/student-panel/knowledge-graph/data";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 72;

type Direction = "TB" | "LR";
type Emphasis = "selected" | "prerequisite" | "unlocks" | "dimmed" | "normal";

type TopicNodeData = {
  topic: GraphTopic;
  emphasis: Emphasis;
  matched: boolean;
  direction: Direction;
};
type TopicFlowNode = Node<TopicNodeData, "topic">;

/** Top-left positions from a layered Dagre layout of the prerequisite DAG. */
function layout(topics: GraphTopic[], links: GraphLink[], direction: Direction) {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: direction, nodesep: 36, ranksep: 72 });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const topic of topics) {
    graph.setNode(topic.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const link of links) graph.setEdge(link.source, link.target);
  dagre.layout(graph);

  return topics.map((topic): TopicFlowNode => {
    const { x, y } = graph.node(topic.id);
    return {
      id: topic.id,
      type: "topic",
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
      data: { topic, emphasis: "normal", matched: false, direction },
    };
  });
}

/** Every topic reachable by following `next` from `start`, excluding start. */
function reach(start: string, next: Map<string, string[]>) {
  const seen = new Set<string>();
  const queue = [...(next.get(start) ?? [])];
  while (queue.length > 0) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    queue.push(...(next.get(id) ?? []));
  }
  return seen;
}

function TopicNode({ data }: NodeProps<TopicFlowNode>) {
  const { topic, emphasis, matched, direction } = data;
  const style = DIFFICULTY_STYLES[topic.difficulty];

  return (
    <div
      className={cn(
        "flex h-[72px] w-[220px] flex-col justify-center gap-1 rounded-lg border bg-surface-container-high px-3 text-left shadow-sm transition-[opacity,box-shadow,border-color] duration-200 motion-reduce:transition-none",
        style.border,
        emphasis === "selected" &&
          "border-primary shadow-[0_0_12px_rgba(99,102,241,0.35)] ring-2 ring-primary",
        emphasis === "prerequisite" && "border-tertiary ring-1 ring-tertiary",
        emphasis === "unlocks" && "border-success ring-1 ring-success",
        emphasis === "dimmed" && "opacity-30",
        matched && emphasis !== "selected" && "ring-2 ring-primary/70",
      )}
    >
      <Handle
        type="target"
        position={direction === "TB" ? Position.Top : Position.Left}
        isConnectable={false}
        className="!size-1.5 !min-h-0 !min-w-0 !border-0 !bg-outline"
      />
      <span className="line-clamp-2 text-label-md text-on-surface">
        {topic.label}
      </span>
      <span className="flex items-center gap-2 text-mono-data text-on-surface-variant">
        <span className={cn("rounded px-1.5 py-px text-label-sm", style.chip)}>
          {style.label}
        </span>
        {topic.estimatedStudyMinutes != null && (
          <span className="flex items-center gap-0.5 tabular-nums">
            <ClockIcon aria-hidden className="size-3" />
            {topic.estimatedStudyMinutes} min
          </span>
        )}
      </span>
      <Handle
        type="source"
        position={direction === "TB" ? Position.Bottom : Position.Right}
        isConnectable={false}
        className="!size-1.5 !min-h-0 !min-w-0 !border-0 !bg-outline"
      />
    </div>
  );
}

const nodeTypes = { topic: TopicNode };

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function Explorer({ graph }: { graph: SelectedGraph }) {
  const { topics, links } = graph;
  const flow = useReactFlow<TopicFlowNode>();
  const [direction, setDirection] = useState<Direction>("TB");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState<Set<Difficulty>>(new Set());

  const [nodes, setNodes, onNodesChange] = useNodesState<TopicFlowNode>(
    layout(topics, links, direction),
  );

  const measured = useNodesInitialized();

  // Re-run the layout when the graph or direction changes; this also resets
  // any nodes the student dragged around.
  useEffect(() => {
    setNodes(layout(topics, links, direction));
  }, [topics, links, direction, setNodes]);

  // Fitting needs node sizes, so wait until React Flow has measured them.
  useEffect(() => {
    if (!measured) return;
    const frame = requestAnimationFrame(() =>
      flow.fitView({ padding: 0.15, duration: prefersReducedMotion() ? 0 : 300 }),
    );
    return () => cancelAnimationFrame(frame);
  }, [measured, direction, flow]);

  const { prerequisitesOf, unlocksOf } = useMemo(() => {
    const prerequisitesOf = new Map<string, string[]>();
    const unlocksOf = new Map<string, string[]>();
    for (const { source, target } of links) {
      prerequisitesOf.set(target, [...(prerequisitesOf.get(target) ?? []), source]);
      unlocksOf.set(source, [...(unlocksOf.get(source) ?? []), target]);
    }
    return { prerequisitesOf, unlocksOf };
  }, [links]);

  const ancestors = useMemo(
    () => (selectedId ? reach(selectedId, prerequisitesOf) : new Set<string>()),
    [selectedId, prerequisitesOf],
  );
  const descendants = useMemo(
    () => (selectedId ? reach(selectedId, unlocksOf) : new Set<string>()),
    [selectedId, unlocksOf],
  );

  const needle = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!needle) return new Set<string>();
    return new Set(
      topics
        .filter(
          (topic) =>
            topic.label.toLowerCase().includes(needle) ||
            topic.keywords.some((keyword) => keyword.toLowerCase().includes(needle)),
        )
        .map((topic) => topic.id),
    );
  }, [needle, topics]);

  function emphasisOf(topic: GraphTopic): Emphasis {
    if (topic.id === selectedId) return "selected";
    if (hidden.has(topic.difficulty)) return "dimmed";
    if (selectedId) {
      if (ancestors.has(topic.id)) return "prerequisite";
      if (descendants.has(topic.id)) return "unlocks";
      return "dimmed";
    }
    if (needle && !matches.has(topic.id)) return "dimmed";
    return "normal";
  }

  const displayNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      emphasis: emphasisOf(node.data.topic),
      matched: matches.has(node.id),
    },
  }));

  const displayEdges: Edge[] = links.map((link) => {
    // On the path: an edge inside the prerequisite chain leading to the
    // selected topic, or inside the chain of topics it unlocks.
    const upstream = (id: string) => id === selectedId || ancestors.has(id);
    const downstream = (id: string) => id === selectedId || descendants.has(id);
    const onPath =
      selectedId !== null &&
      ((ancestors.has(link.source) && upstream(link.target)) ||
        (downstream(link.source) && descendants.has(link.target)));
    const color = !selectedId
      ? "var(--color-outline)"
      : onPath
        ? "var(--color-primary)"
        : "var(--color-outline-variant)";

    return {
      id: link.id,
      source: link.source,
      target: link.target,
      type: "smoothstep",
      animated: onPath,
      focusable: false,
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
      style: {
        stroke: color,
        strokeWidth: onPath ? 2 : 1.25,
        opacity: selectedId && !onPath ? 0.35 : 1,
      },
    };
  });

  function focusTopic(id: string) {
    setSelectedId(id);
    const node = nodes.find((candidate) => candidate.id === id);
    if (!node) return;
    flow.setCenter(
      node.position.x + NODE_WIDTH / 2,
      node.position.y + NODE_HEIGHT / 2,
      { zoom: Math.max(flow.getZoom(), 1), duration: prefersReducedMotion() ? 0 : 400 },
    );
  }

  function toggleDifficulty(difficulty: Difficulty) {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(difficulty)) next.delete(difficulty);
      else next.add(difficulty);
      return next;
    });
  }

  const topicsById = useMemo(
    () => new Map(topics.map((topic) => [topic.id, topic])),
    [topics],
  );
  const order = useMemo(() => studyOrder(topics, links), [topics, links]);
  const selected = selectedId ? topicsById.get(selectedId) ?? null : null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section
        aria-label={`Knowledge graph for ${graph.documentName}`}
        className="flex min-w-0 flex-col overflow-hidden rounded-xl bg-surface-container"
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-surface-container-highest p-3">
          <label className="relative min-w-48 flex-1">
            <span className="sr-only">Search topics</span>
            <SearchIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-outline"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                const first = [...matches][0];
                if (event.key === "Enter" && first) focusTopic(first);
              }}
              placeholder="Search topics or keywords"
              className="w-full rounded-lg bg-surface-container-lowest py-1.5 pr-3 pl-9 text-body-sm text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </label>
          {needle && (
            <span aria-live="polite" className="text-mono-data text-on-surface-variant">
              {matches.size} {matches.size === 1 ? "match" : "matches"}
            </span>
          )}

          <div role="group" aria-label="Layout direction" className="flex rounded-lg bg-surface-container-lowest p-0.5">
            {(
              [
                ["TB", "Top to bottom", ArrowDownIcon],
                ["LR", "Left to right", ArrowRightIcon],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={direction === value}
                aria-label={label}
                title={label}
                onClick={() => setDirection(value)}
                className={cn(
                  "rounded-md p-1.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  direction === value
                    ? "bg-surface-container-high text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-b border-surface-container-highest px-3 py-2">
          <span className="mr-1 text-label-md text-on-surface-variant">Difficulty</span>
          {DIFFICULTIES.map((difficulty) => {
            const style = DIFFICULTY_STYLES[difficulty];
            const shown = !hidden.has(difficulty);
            return (
              <button
                key={difficulty}
                type="button"
                aria-pressed={shown}
                onClick={() => toggleDifficulty(difficulty)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-label-sm transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  style.chip,
                  !shown && "opacity-40 line-through",
                )}
              >
                {style.label}
              </button>
            );
          })}
          {selected && (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-label-md text-on-surface-variant transition-colors outline-none hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-2 focus-visible:ring-primary"
            >
              <XIcon aria-hidden className="size-3.5" />
              Clear selection
            </button>
          )}
        </div>

        <div
          className={cn(
            "h-[60dvh] min-h-[420px]",
            // Map React Flow's own palette onto the design tokens.
            "[--xy-background-color:var(--color-surface-container-lowest)]",
            "[--xy-background-pattern-dots-color-default:var(--color-outline-variant)]",
            "[--xy-controls-button-background-color-default:var(--color-surface-container-high)]",
            "[--xy-controls-button-background-color-hover-default:var(--color-surface-bright)]",
            "[--xy-controls-button-color-default:var(--color-on-surface)]",
            "[--xy-controls-button-color-hover-default:var(--color-on-surface)]",
            "[--xy-controls-button-border-color-default:var(--color-outline-variant)]",
          )}
        >
          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            nodesConnectable={false}
            edgesFocusable={false}
            minZoom={0.2}
            maxZoom={2}
            fitView
            fitViewOptions={{ padding: 0.15 }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              ariaLabel="Graph overview"
              className="!hidden overflow-hidden rounded-lg border border-outline-variant sm:!block"
              style={{ width: 160, height: 110 }}
              bgColor="var(--color-surface-container)"
              maskColor="color-mix(in oklab, var(--color-surface-container-lowest) 60%, transparent)"
              nodeBorderRadius={4}
              nodeColor={(node) =>
                node.id === selectedId
                  ? "var(--color-primary)"
                  : "var(--color-outline-variant)"
              }
            />
          </ReactFlow>
        </div>
      </section>

      <GraphDetails
        graph={graph}
        selected={selected}
        prerequisites={(selected && prerequisitesOf.get(selected.id)) || []}
        unlocks={(selected && unlocksOf.get(selected.id)) || []}
        order={order}
        topicsById={topicsById}
        onSelect={focusTopic}
      />
    </div>
  );
}

export function GraphExplorer({ graph }: { graph: SelectedGraph }) {
  return (
    <ReactFlowProvider>
      {/* Remount per graph so selection, search and dragged positions reset. */}
      <Explorer key={graph.id} graph={graph} />
    </ReactFlowProvider>
  );
}
