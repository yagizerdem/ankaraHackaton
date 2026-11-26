import mongoose from "mongoose";

import { masteryScore, masteryStatus } from "@/lib/assessment/mastery";
import { loadGraph } from "@/lib/assessment/service";
import { calibrate } from "@/lib/learning/calibration";
import { buildLearningPath } from "@/lib/learning/path";
import { Assessment } from "@/models/assessment";
import { LearningGoal } from "@/models/learning-goal";
import { Question } from "@/models/question";
import { TopicMastery } from "@/models/topic-mastery";
import { User } from "@/models/user";
import { WeeklySummary } from "@/models/weekly-summary";

import type { MasteryStatus } from "@/lib/assessment/mastery";
import type { Calibration } from "@/lib/learning/calibration";
import type { LearningPath, PathTopic } from "@/lib/learning/path";
import type { Confidence } from "@/models/assessment";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface MistakePattern {
  misconception: string;
  count: number;
  /** How many of these were answered "sure". */
  confident: number;
  topics: string[];
}

export interface ReportTopic {
  id: string;
  label: string;
  mastery: number;
  evidence: number;
  status: MasteryStatus;
}

export interface WeeklyStats {
  answers: number;
  correct: number;
  topics: { label: string; correct: number; total: number }[];
  confidentMistakes: number;
  topMistake: string | null;
  sureAccuracy: number | null;
  guessAccuracy: number | null;
  goal: { topic: string; daysLeft: number } | null;
}

export interface LearningReport {
  graphId: string;
  documentName: string;
  studentName: string;
  topics: ReportTopic[];
  calibration: Calibration;
  mistakes: MistakePattern[];
  goal: { targetTopicId: string; examDate: string } | null;
  path: LearningPath | null;
  summary: { text: string; createdAt: string } | null;
  weekly: WeeklyStats;
}

type AnswerRow = {
  questionId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  selectedOptionId: string;
  correct: boolean;
  confidence?: Confidence | null;
  answeredAt: Date;
};

/** Wrong answers grouped by the misconception behind the chosen option. */
async function mistakePatterns(answers: AnswerRow[], labelOf: (id: string) => string) {
  const wrong = answers.filter((answer) => !answer.correct);
  const questions = await Question.find({
    _id: { $in: wrong.map((answer) => answer.questionId) },
  })
    .select("options")
    .lean();
  const byId = new Map(questions.map((question) => [question._id.toString(), question]));

  const groups = new Map<string, MistakePattern & { topicIds: Set<string> }>();
  for (const answer of wrong) {
    const option = byId
      .get(answer.questionId.toString())
      ?.options.find((candidate) => candidate.id === answer.selectedOptionId);
    const text = option?.misconception?.trim();
    if (!text) continue;
    // Group case-insensitively; the generator reuses the topic's wording.
    const key = text.toLowerCase().replace(/[.\s]+$/, "");
    const group = groups.get(key) ?? {
      misconception: text,
      count: 0,
      confident: 0,
      topics: [],
      topicIds: new Set<string>(),
    };
    group.count += 1;
    if (answer.confidence === "sure") group.confident += 1;
    group.topicIds.add(answer.topicId.toString());
    groups.set(key, group);
  }

  return [...groups.values()]
    .sort((a, b) => b.count - a.count || b.confident - a.confident)
    .map(({ topicIds, ...group }) => ({
      ...group,
      topics: [...topicIds].map(labelOf),
    }));
}

/**
 * Everything known about a student's progress on one graph: mastery,
 * confidence calibration, repeated mistakes, goal and route, weekly numbers.
 * Throws 404 when the graph isn't the user's.
 */
export async function getLearningReport(
  userId: mongoose.Types.ObjectId,
  graphId: string | mongoose.Types.ObjectId,
  now = new Date(),
): Promise<LearningReport> {
  const context = await loadGraph(graphId, userId);
  const graphObjectId = context.graph._id;

  const [user, masteries, assessments, goal, summary] = await Promise.all([
    User.findById(userId).select("username firstName lastName").lean(),
    TopicMastery.find({ userId, graphId: graphObjectId }).lean(),
    Assessment.find({ userId, graphId: graphObjectId }).select("answers").lean(),
    LearningGoal.findOne({ userId, graphId: graphObjectId }).lean(),
    WeeklySummary.findOne({ userId, graphId: graphObjectId }).sort({ createdAt: -1 }).lean(),
  ]);

  const answers: AnswerRow[] = assessments.flatMap((assessment) => assessment.answers);
  const evidence = new Map(
    masteries.map((record) => [
      record.topicId.toString(),
      { correct: record.correct, incorrect: record.incorrect },
    ]),
  );

  const topics: ReportTopic[] = context.topics.map((topic) => {
    const id = topic._id.toString();
    const record = evidence.get(id) ?? { correct: 0, incorrect: 0 };
    return {
      id,
      label: topic.label,
      mastery: masteryScore(record.correct, record.incorrect),
      evidence: record.correct + record.incorrect,
      status: masteryStatus(record.correct, record.incorrect),
    };
  });

  const confidentMistakes = new Map<string, number>();
  for (const answer of answers) {
    if (answer.confidence !== "sure" || answer.correct) continue;
    const id = answer.topicId.toString();
    confidentMistakes.set(id, (confidentMistakes.get(id) ?? 0) + 1);
  }

  const pathTopics = new Map<string, PathTopic>(
    context.topics.map((topic) => [
      topic._id.toString(),
      {
        id: topic._id.toString(),
        label: topic.label,
        importance: topic.importance ?? 0.5,
        estimatedStudyMinutes: topic.estimatedStudyMinutes ?? null,
      },
    ]),
  );
  const targetId = goal?.targetTopicId.toString();
  const path =
    goal && targetId && pathTopics.has(targetId)
      ? buildLearningPath({
          targetId,
          topics: pathTopics,
          prerequisitesOf: context.prerequisitesOf,
          evidence,
          confidentMistakes,
          examDate: goal.examDate,
          today: now,
        })
      : null;

  const calibration = calibrate(answers);
  const mistakes = await mistakePatterns(answers, context.labelOf);

  // The last 7 days, as plain numbers for the weekly note.
  const recent = answers.filter((answer) => now.getTime() - answer.answeredAt.getTime() < WEEK_MS);
  const recentByTopic = new Map<string, { correct: number; total: number }>();
  for (const answer of recent) {
    const id = answer.topicId.toString();
    const entry = recentByTopic.get(id) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (answer.correct) entry.correct += 1;
    recentByTopic.set(id, entry);
  }
  const recentCalibration = calibrate(recent);
  const recentMistakes = await mistakePatterns(recent, context.labelOf);

  return {
    graphId: graphObjectId.toString(),
    documentName: context.documentName,
    studentName: user?.firstName || user?.username || "Student",
    topics,
    calibration,
    mistakes,
    goal:
      goal && targetId
        ? { targetTopicId: targetId, examDate: goal.examDate.toISOString().slice(0, 10) }
        : null,
    path,
    summary: summary
      ? { text: summary.text, createdAt: summary.createdAt.toISOString() }
      : null,
    weekly: {
      answers: recent.length,
      correct: recent.filter((answer) => answer.correct).length,
      topics: [...recentByTopic].map(([id, stats]) => ({
        label: context.labelOf(id),
        ...stats,
      })),
      confidentMistakes: recentCalibration.confidentMistakes,
      topMistake: recentMistakes[0]?.misconception ?? null,
      sureAccuracy: recentCalibration.rows[0].accuracy,
      guessAccuracy: recentCalibration.rows[2].accuracy,
      goal: path ? { topic: path.targetLabel, daysLeft: path.daysLeft } : null,
    },
  };
}
