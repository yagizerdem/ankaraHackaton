import type {
  Difficulty,
  GraphLink,
  GraphTopic,
} from "@/app/student-panel/knowledge-graph/data";

export const DIFFICULTIES: Difficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

export const DIFFICULTY_STYLES: Record<
  Difficulty,
  { label: string; chip: string; border: string; dot: string }
> = {
  beginner: {
    label: "Beginner",
    chip: "bg-success/15 text-success",
    border: "border-success/40",
    dot: "bg-success",
  },
  intermediate: {
    label: "Intermediate",
    chip: "bg-primary/15 text-primary",
    border: "border-primary/40",
    dot: "bg-primary",
  },
  advanced: {
    label: "Advanced",
    chip: "bg-tertiary/15 text-tertiary",
    border: "border-tertiary/40",
    dot: "bg-tertiary",
  },
  expert: {
    label: "Expert",
    chip: "bg-error/15 text-error",
    border: "border-error/40",
    dot: "bg-error",
  },
};

/**
 * A study order that respects every prerequisite (topological sort). Among
 * topics that are ready at the same time, the more important one comes first.
 */
export function studyOrder(topics: GraphTopic[], links: GraphLink[]) {
  const inDegree = new Map(topics.map((topic) => [topic.id, 0]));
  const unlocks = new Map<string, string[]>();
  for (const { source, target } of links) {
    inDegree.set(target, (inDegree.get(target) ?? 0) + 1);
    unlocks.set(source, [...(unlocks.get(source) ?? []), target]);
  }

  const byId = new Map(topics.map((topic) => [topic.id, topic]));
  const ready = topics.filter((topic) => inDegree.get(topic.id) === 0);
  const order: GraphTopic[] = [];

  while (ready.length > 0) {
    ready.sort((a, b) => b.importance - a.importance);
    const topic = ready.shift()!;
    order.push(topic);
    for (const next of unlocks.get(topic.id) ?? []) {
      const degree = inDegree.get(next)! - 1;
      inDegree.set(next, degree);
      if (degree === 0) ready.push(byId.get(next)!);
    }
  }
  return order;
}
