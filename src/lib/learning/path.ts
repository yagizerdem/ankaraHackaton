import { ancestorsOf } from "@/lib/assessment/adaptive";
import { masteryScore, masteryStatus } from "@/lib/assessment/mastery";

import type { MasteryStatus } from "@/lib/assessment/mastery";

export type StepAction = "fix" | "test" | "study" | "goal";

export interface PathTopic {
  id: string;
  label: string;
  importance: number;
  estimatedStudyMinutes: number | null;
}

export interface PathStep {
  topicId: string;
  label: string;
  action: StepAction;
  reason: string;
  minutes: number;
  status: MasteryStatus;
  mastery: number;
}

export interface PathDay {
  day: number;
  /** ISO date (yyyy-mm-dd) of the day. */
  date: string;
  steps: PathStep[];
  minutes: number;
}

export interface LearningPath {
  targetId: string;
  targetLabel: string;
  daysLeft: number;
  days: PathDay[];
  /** Prerequisites left out because the student already knows them. */
  skipped: { id: string; label: string }[];
}

const TEST_MINUTES = 10;
const RETEST_MINUTES = 10;
const DEFAULT_STUDY_MINUTES = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Topics in prerequisite order; among ready ones, the more important first. */
function topologicalOrder(
  ids: string[],
  prerequisitesOf: Map<string, string[]>,
  importanceOf: (id: string) => number,
) {
  const inSet = new Set(ids);
  const inDegree = new Map(ids.map((id) => [id, 0]));
  const unlocks = new Map<string, string[]>();
  for (const id of ids) {
    for (const parent of prerequisitesOf.get(id) ?? []) {
      if (!inSet.has(parent)) continue;
      inDegree.set(id, inDegree.get(id)! + 1);
      unlocks.set(parent, [...(unlocks.get(parent) ?? []), id]);
    }
  }
  const ready = ids.filter((id) => inDegree.get(id) === 0);
  const order: string[] = [];
  while (ready.length > 0) {
    ready.sort((a, b) => importanceOf(b) - importanceOf(a));
    const id = ready.shift()!;
    order.push(id);
    for (const next of unlocks.get(id) ?? []) {
      const degree = inDegree.get(next)! - 1;
      inDegree.set(next, degree);
      if (degree === 0) ready.push(next);
    }
  }
  return order;
}

/**
 * The spec's route: the target and its prerequisites in order, skipping what
 * is mastered, testing what is unmeasured and studying what is weak. Topics
 * with confident mistakes come first among those that are ready, since they
 * point at a misconception. The steps are then split across the days left.
 */
export function buildLearningPath({
  targetId,
  topics,
  prerequisitesOf,
  evidence,
  confidentMistakes,
  examDate,
  today,
}: {
  targetId: string;
  topics: Map<string, PathTopic>;
  prerequisitesOf: Map<string, string[]>;
  evidence: Map<string, { correct: number; incorrect: number }>;
  confidentMistakes: Map<string, number>;
  examDate: Date;
  today: Date;
}): LearningPath {
  const target = topics.get(targetId)!;
  const scope = [targetId, ...ancestorsOf(targetId, prerequisitesOf)];
  // Misconceptions first, then importance, among topics that are ready.
  const priority = (id: string) =>
    (confidentMistakes.get(id) ?? 0) * 10 + (topics.get(id)?.importance ?? 0.5);
  const ordered = topologicalOrder(scope, prerequisitesOf, priority);

  const steps: PathStep[] = [];
  const skipped: { id: string; label: string }[] = [];

  for (const id of ordered) {
    const topic = topics.get(id);
    if (!topic) continue;
    const record = evidence.get(id) ?? { correct: 0, incorrect: 0 };
    const status = masteryStatus(record.correct, record.incorrect);
    const mastery = masteryScore(record.correct, record.incorrect);
    const study = topic.estimatedStudyMinutes ?? DEFAULT_STUDY_MINUTES;
    const misconceptions = confidentMistakes.get(id) ?? 0;
    const isTarget = id === targetId;

    if (status === "mastered" && misconceptions === 0) {
      if (!isTarget) skipped.push({ id, label: topic.label });
      continue;
    }

    let step: Omit<PathStep, "topicId" | "label" | "status" | "mastery">;
    if (misconceptions > 0) {
      step = {
        action: "fix",
        reason: `You were sure but wrong ${misconceptions === 1 ? "once" : `${misconceptions} times`} here, which usually means a misconception. Review it, then retest.`,
        minutes: study + RETEST_MINUTES,
      };
    } else if (isTarget) {
      step = {
        action: "goal",
        reason: "Your goal. Study it once its prerequisites are in place, then take an exam on it.",
        minutes: study + RETEST_MINUTES,
      };
    } else if (status === "unmeasured") {
      step = {
        action: "test",
        reason: "Not measured yet. A short exam shows whether you need to study it.",
        minutes: TEST_MINUTES,
      };
    } else {
      step = {
        action: "study",
        reason: `A prerequisite of ${target.label}, and your score here is ${Math.round(mastery * 100)}%. Study it, then retest.`,
        minutes: study + RETEST_MINUTES,
      };
    }
    steps.push({ topicId: id, label: topic.label, status, mastery, ...step });
  }

  // Days from today up to the day before the exam, at least one. Today is the
  // local calendar day; the exam date is stored at noon UTC of its day.
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const end = Date.UTC(examDate.getUTCFullYear(), examDate.getUTCMonth(), examDate.getUTCDate());
  const daysLeft = Math.max(1, Math.round((end - start) / DAY_MS));

  // Fill days in order: each day runs up to its even share of the total, at
  // least one step a day, and the last day takes whatever is left. With
  // fewer steps than days, the later days stay free.
  const total = steps.reduce((sum, step) => sum + step.minutes, 0);
  const days: PathDay[] = [];
  let index = 0;
  let scheduled = 0;
  for (let day = 0; day < daysLeft && index < steps.length; day++) {
    const lastDay = day === daysLeft - 1;
    const dueBy = (total * (day + 1)) / daysLeft;
    const daySteps: PathStep[] = [];
    let minutes = 0;
    while (
      index < steps.length &&
      (lastDay || daySteps.length === 0 || scheduled + steps[index].minutes <= dueBy)
    ) {
      minutes += steps[index].minutes;
      scheduled += steps[index].minutes;
      daySteps.push(steps[index++]);
    }
    days.push({
      day: day + 1,
      date: new Date(start + day * DAY_MS).toISOString().slice(0, 10),
      steps: daySteps,
      minutes,
    });
  }

  return { targetId, targetLabel: target.label, daysLeft, days, skipped };
}
