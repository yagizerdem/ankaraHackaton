import { cookies } from "next/headers";
import { connection } from "next/server";

import { getKnowledgeGraphs } from "@/app/student-panel/knowledge-graph/data";
import { studyOrder } from "@/app/student-panel/knowledge-graph/graph-utils";
import { masteryScore, masteryStatus } from "@/lib/assessment/mastery";
import { listAssessments } from "@/lib/assessment/service";
import { SESSION_COOKIE, verifySessionAndGetUser } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { TopicMastery } from "@/models/topic-mastery";

import type { AssessmentSummary } from "@/domain/assessment";
import type { GraphOption } from "@/app/student-panel/knowledge-graph/data";
import type { MasteryStatus } from "@/lib/assessment/mastery";

export interface MasteryRow {
  topicId: string;
  label: string;
  mastery: number;
  evidence: number;
  status: MasteryStatus;
}

export interface AssessmentHome {
  graphs: GraphOption[];
  selectedGraphId: string | null;
  /** The selected graph's topics in study order, with the student's mastery. */
  mastery: MasteryRow[];
  exams: AssessmentSummary[];
}

/** Everything the exam home page shows, or null when signed out. */
export async function getAssessmentHome(
  requestedGraphId: string | undefined,
): Promise<AssessmentHome | null> {
  await connection();
  const graphs = await getKnowledgeGraphs(requestedGraphId);
  if (!graphs) return null;

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await dbConnect();
  const user = await verifySessionAndGetUser(token);
  if (!user) return null;

  const selected = graphs.selected;
  const [records, exams] = await Promise.all([
    selected
      ? TopicMastery.find({ userId: user._id, graphId: selected.id }).lean()
      : [],
    listAssessments(user._id),
  ]);
  const byTopic = new Map(records.map((record) => [record.topicId.toString(), record]));

  return {
    graphs: graphs.options,
    selectedGraphId: selected?.id ?? null,
    mastery: selected
      ? studyOrder(selected.topics, selected.links).map((topic) => {
          const record = byTopic.get(topic.id);
          const correct = record?.correct ?? 0;
          const incorrect = record?.incorrect ?? 0;
          return {
            topicId: topic.id,
            label: topic.label,
            mastery: masteryScore(correct, incorrect),
            evidence: correct + incorrect,
            status: masteryStatus(correct, incorrect),
          };
        })
      : [],
    exams,
  };
}
