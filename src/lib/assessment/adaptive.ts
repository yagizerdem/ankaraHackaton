/** Answers needed on a topic within one exam: enough to leave "unmeasured". */
export const QUESTIONS_PER_TOPIC = 3;
/** At or below this share of correct answers, the exam probes prerequisites. */
const PROBE_PREREQUISITES_AT = 0.5;

export interface PendingTopic {
  topicId: string;
  reason: string;
}

export interface AnswerRecord {
  topicId: string;
  correct: boolean;
}

export interface PlanInput {
  pending: PendingTopic[];
  answers: AnswerRecord[];
  questionBudget: number;
  /** Direct prerequisites of each topic (edge sources pointing at it). */
  prerequisitesOf: Map<string, string[]>;
  labelOf: (topicId: string) => string;
}

export interface Plan {
  pending: PendingTopic[];
  /** Null when the exam should end. */
  next: PendingTopic | null;
}

function statsByTopic(answers: AnswerRecord[]) {
  const stats = new Map<string, { total: number; correct: number }>();
  for (const { topicId, correct } of answers) {
    const entry = stats.get(topicId) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (correct) entry.correct += 1;
    stats.set(topicId, entry);
  }
  return stats;
}

/**
 * Picks the next topic to ask about, following the spec's rules:
 * 1. Keep asking about a topic until it has enough evidence in this exam.
 * 2. If the student struggled with it, test its direct prerequisites next.
 *    A wrong answer never lowers the prerequisites' scores by itself; they
 *    have to be checked with their own questions.
 * 3. Otherwise continue with the queue, and stop when the budget is spent.
 */
export function planNext({
  pending,
  answers,
  questionBudget,
  prerequisitesOf,
  labelOf,
}: PlanInput): Plan {
  if (answers.length >= questionBudget) return { pending, next: null };

  const stats = statsByTopic(answers);
  let queue = [...pending];
  const last = answers.at(-1);

  if (last) {
    const lastStats = stats.get(last.topicId)!;

    if (lastStats.total < QUESTIONS_PER_TOPIC) {
      return {
        pending: queue,
        next: {
          topicId: last.topicId,
          reason: `One more question on ${labelOf(last.topicId)} to be sure`,
        },
      };
    }

    if (lastStats.correct / lastStats.total <= PROBE_PREREQUISITES_AT) {
      const queued = new Set(queue.map((entry) => entry.topicId));
      const probes = (prerequisitesOf.get(last.topicId) ?? [])
        .filter((id) => !stats.has(id) && !queued.has(id))
        .map((id) => ({
          topicId: id,
          reason: `Checking ${labelOf(id)}, a prerequisite of ${labelOf(last.topicId)}`,
        }));
      queue = [...probes, ...queue];
    }
  }

  // Drop topics that already have enough evidence in this exam.
  queue = queue.filter(
    (entry) => (stats.get(entry.topicId)?.total ?? 0) < QUESTIONS_PER_TOPIC,
  );

  return { pending: queue, next: queue[0] ?? null };
}

/** Every topic `target` depends on, nearest first (reverse BFS over the DAG). */
export function ancestorsOf(
  target: string,
  prerequisitesOf: Map<string, string[]>,
) {
  const visited = new Set([target]);
  const queue = [target];
  for (let i = 0; i < queue.length; i++) {
    for (const parent of prerequisitesOf.get(queue[i]) ?? []) {
      if (!visited.has(parent)) {
        visited.add(parent);
        queue.push(parent);
      }
    }
  }
  return queue.slice(1);
}
