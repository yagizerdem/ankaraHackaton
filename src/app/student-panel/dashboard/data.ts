import { cookies } from "next/headers";
import { connection } from "next/server";

import { getKnowledgeGraphs } from "@/app/student-panel/knowledge-graph/data";
import { getUploads } from "@/app/student-panel/uploads/data";
import { ancestorsOf } from "@/lib/assessment/adaptive";
import { listAssessments } from "@/lib/assessment/service";
import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { getLearningReport } from "@/lib/learning/report";
import { Assessment } from "@/models/assessment";

import type { AssessmentSummary } from "@/domain/assessment";
import type { GraphLink, GraphOption } from "@/app/student-panel/knowledge-graph/data";
import type { UploadRow } from "@/app/student-panel/uploads/data";
import type { MasteryStatus } from "@/lib/assessment/mastery";
import type { PathStep } from "@/lib/learning/path";
import type { ReportTopic } from "@/lib/learning/report";

export interface DashboardTopic {
  id: string;
  label: string;
  status: MasteryStatus;
  mastery: number;
  evidence: number;
}

export interface Diagnosis {
  tone: "gap" | "weak" | "unmeasured" | "clear";
  text: string;
  /** Topic the recommended action targets, for the "start" button. */
  topicId: string | null;
  topicLabel: string | null;
}

export interface DashboardData {
  firstName: string;
  graphs: GraphOption[];
  selectedGraphId: string | null;
  documentName: string | null;
  uploads: UploadRow[];
  overall: {
    /** Average mastery of the measured topics, 0-1; null when none. */
    mastery: number | null;
    correct: number;
    incorrect: number;
    measured: number;
    topicCount: number;
    /** Score of the last finished exam on this graph, and the one before. */
    lastExam: number | null;
    previousExam: number | null;
  };
  /** The weak topic blocking the most others, and its weakest root cause. */
  bottleneck: { topic: string; blocks: number; rootCause: string } | null;
  documents: { count: number; pages: number; topics: number; links: number };
  path: {
    target: string;
    done: number;
    total: number;
    next: PathStep | null;
    steps: PathStep[];
  } | null;
  graph: {
    topics: DashboardTopic[];
    links: GraphLink[];
    depth: number;
    createdAt: string;
  } | null;
  diagnosis: Diagnosis | null;
  inProgressExam: AssessmentSummary | null;
}

/** Longest prerequisite chain, in levels (a single topic is depth 1). */
function graphDepth(topics: { id: string }[], links: GraphLink[]) {
  const unlocks = new Map<string, string[]>();
  const inDegree = new Map(topics.map((topic) => [topic.id, 0]));
  for (const { source, target } of links) {
    unlocks.set(source, [...(unlocks.get(source) ?? []), target]);
    inDegree.set(target, (inDegree.get(target) ?? 0) + 1);
  }
  const level = new Map<string, number>();
  const queue = topics.filter((topic) => inDegree.get(topic.id) === 0).map((topic) => topic.id);
  for (const id of queue) level.set(id, 1);
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    for (const next of unlocks.get(id) ?? []) {
      level.set(next, Math.max(level.get(next) ?? 1, level.get(id)! + 1));
      const degree = inDegree.get(next)! - 1;
      inDegree.set(next, degree);
      if (degree === 0) queue.push(next);
    }
  }
  return Math.max(0, ...level.values());
}

/**
 * The spec's gap analysis applied to the whole graph: the weak topic that
 * blocks the most others, traced back to its nearest weak prerequisite.
 */
function findBottleneck(topics: ReportTopic[], links: GraphLink[]) {
  const prerequisitesOf = new Map<string, string[]>();
  const unlocks = new Map<string, string[]>();
  for (const { source, target } of links) {
    prerequisitesOf.set(target, [...(prerequisitesOf.get(target) ?? []), source]);
    unlocks.set(source, [...(unlocks.get(source) ?? []), target]);
  }
  const byId = new Map(topics.map((topic) => [topic.id, topic]));
  const descendants = (id: string) => ancestorsOf(id, unlocks).length;

  const weak = topics
    .filter((topic) => topic.status === "weak")
    .sort((a, b) => descendants(b.id) - descendants(a.id) || a.mastery - b.mastery);
  const worst = weak[0];
  if (!worst) return { bottleneck: null, root: null, worst: null, untested: [] };

  const ancestors = ancestorsOf(worst.id, prerequisitesOf)
    .map((id) => byId.get(id))
    .filter((topic): topic is ReportTopic => Boolean(topic));
  const root =
    ancestors.find((topic) => ["weak", "developing"].includes(topic.status)) ?? null;
  // Untested prerequisites could still be the cause; never call them "fine".
  const untested = ancestors.filter((topic) => topic.status === "unmeasured");

  return {
    bottleneck: {
      topic: worst.label,
      blocks: descendants(worst.id),
      rootCause: root?.label ?? worst.label,
    },
    root,
    worst,
    untested,
  };
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

/** Everything the dashboard shows, from the database. Null when signed out. */
export async function getDashboard(
  requestedGraphId: string | undefined,
): Promise<DashboardData | null> {
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await dbConnect();
  const user = await verifySessionAndGetUser(token);
  if (!user) return null;

  // Each helper checks the session itself, so a stale cookie can't mix users.
  const [uploads, graphs, exams] = await Promise.all([
    getUploads(),
    getKnowledgeGraphs(requestedGraphId),
    listAssessments(user._id),
  ]);
  const rows = uploads?.rows ?? [];
  const selected = graphs?.selected ?? null;
  const report = selected ? await getLearningReport(user._id, selected.id) : null;

  const documents = {
    count: rows.length,
    pages: rows.reduce((sum, row) => sum + (row.pageCount ?? 0), 0),
    topics: graphs?.options.reduce((sum, option) => sum + option.topicCount, 0) ?? 0,
    links: graphs?.options.reduce((sum, option) => sum + option.linkCount, 0) ?? 0,
  };

  // Overall mastery and the last two finished exams on this graph.
  const measured = report?.topics.filter((topic) => topic.evidence > 0) ?? [];
  const finished = selected
    ? await Assessment.find({ userId: user._id, graphId: selected.id, status: "completed" })
        .sort({ completedAt: -1 })
        .limit(2)
        .select("answers")
        .lean()
    : [];
  const examScore = (index: number) => {
    const answers = finished[index]?.answers ?? [];
    return answers.length
      ? answers.filter((answer) => answer.correct).length / answers.length
      : null;
  };

  const gap = report && selected ? findBottleneck(report.topics, selected.links) : null;

  let diagnosis: Diagnosis | null = null;
  if (report) {
    const unmeasured = report.topics.filter((topic) => topic.status === "unmeasured");
    if (gap?.worst && gap.root) {
      diagnosis = {
        tone: "gap",
        text: `You're struggling with ${gap.worst.label} (${percent(gap.worst.mastery)}). Its prerequisite ${gap.root.label} is also weak at ${percent(gap.root.mastery)}, which is the likely root cause. Study ${gap.root.label} first.`,
        topicId: gap.root.id,
        topicLabel: gap.root.label,
      };
    } else if (gap?.worst && gap.untested.length > 0) {
      diagnosis = {
        tone: "weak",
        text: `${gap.worst.label} is your weakest topic at ${percent(gap.worst.mastery)}. ${gap.untested.length} of its prerequisites haven't been tested yet, so a quick check aimed at it will show whether one of them is the cause.`,
        topicId: gap.worst.id,
        topicLabel: gap.worst.label,
      };
    } else if (gap?.worst) {
      diagnosis = {
        tone: "weak",
        text: `${gap.worst.label} is your weakest topic at ${percent(gap.worst.mastery)}. Its prerequisites are measured and solid, so practise it directly.`,
        topicId: gap.worst.id,
        topicLabel: gap.worst.label,
      };
    } else if (unmeasured.length > 0) {
      diagnosis = {
        tone: "unmeasured",
        text: `${unmeasured.length} of ${report.topics.length} topics have no evidence yet. A short exam will show where you stand.`,
        topicId: null,
        topicLabel: null,
      };
    } else {
      diagnosis = {
        tone: "clear",
        text: "No gaps found: every topic is measured and none is weak.",
        topicId: null,
        topicLabel: null,
      };
    }
  }

  const steps = report?.path?.days.flatMap((day) => day.steps) ?? [];
  const skipped = report?.path?.skipped.length ?? 0;

  return {
    firstName: user.firstName || user.username,
    graphs: graphs?.options ?? [],
    selectedGraphId: selected?.id ?? null,
    documentName: selected?.documentName ?? null,
    uploads: rows,
    overall: {
      mastery: measured.length
        ? measured.reduce((sum, topic) => sum + topic.mastery, 0) / measured.length
        : null,
      correct: measured.reduce((sum, topic) => sum + topic.correct, 0),
      incorrect: measured.reduce((sum, topic) => sum + topic.incorrect, 0),
      measured: measured.length,
      topicCount: report?.topics.length ?? 0,
      lastExam: examScore(0),
      previousExam: examScore(1),
    },
    bottleneck: gap?.bottleneck ?? null,
    documents,
    path: report?.path
      ? {
          target: report.path.targetLabel,
          done: skipped,
          total: skipped + steps.length,
          next: steps[0] ?? null,
          steps,
        }
      : null,
    graph:
      selected && report
        ? {
            topics: report.topics.map(({ id, label, status, mastery, evidence }) => ({
              id,
              label,
              status,
              mastery,
              evidence,
            })),
            links: selected.links,
            depth: graphDepth(selected.topics, selected.links),
            createdAt:
              graphs!.options.find((option) => option.id === selected.id)!.createdAt.toISOString(),
          }
        : null,
    diagnosis,
    inProgressExam:
      exams.find(
        (exam) => exam.status === "in_progress" && exam.graphId === selected?.id,
      ) ?? null,
  };
}
