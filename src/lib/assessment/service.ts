import mongoose from "mongoose";

import { AppError } from "@/error/app-error";
import {
  QUESTIONS_PER_TOPIC,
  ancestorsOf,
  planNext,
} from "@/lib/assessment/adaptive";
import { generateExamQuestions } from "@/lib/assessment/generate-question";
import { GENERATION_MODEL } from "@/lib/ai/gemini";
import { masteryScore, masteryStatus } from "@/lib/assessment/mastery";
import { calibrate } from "@/lib/learning/calibration";
import HttpStatusCode from "@/lib/http-status-code";
import { retrieveChunks } from "@/lib/rag/retrieve";
import { Assessment } from "@/models/assessment";
import { Document } from "@/models/document";
import { Embedding } from "@/models/embedding";
import { KnowledgeGraph, TopicEdge, TopicNode } from "@/models/knowledge-graph";
import { Question } from "@/models/question";
import { TopicMastery } from "@/models/topic-mastery";

import type {
  AnswerFeedback,
  AnswerInput,
  AssessmentResults,
  AssessmentSummary,
  AssessmentView,
  GapAnalysis,
  StartAssessmentInput,
} from "@/domain/assessment";
import type { AssessmentDocument } from "@/models/assessment";
import type { QuestionDifficulty } from "@/models/question";

/** Without a target, the exam starts from this many of the key topics. */
const DEFAULT_TARGETS = 3;
const EXCERPT_LENGTH = 280;

type UserId = mongoose.Types.ObjectId;

/** A graph the user owns, with lookups the adaptive engine needs. */
export async function loadGraph(
  graphId: string | mongoose.Types.ObjectId,
  userId: UserId,
) {
  const graph = await KnowledgeGraph.findById(graphId).lean();
  // Graphs belong to documents, so ownership goes through Document.
  const document = graph
    ? await Document.findOne({ _id: graph.documentId, userId })
        .select("name")
        .lean()
    : null;
  if (!graph || !document) {
    throw new AppError("Knowledge graph not found", HttpStatusCode.NOT_FOUND);
  }

  const [topics, edges] = await Promise.all([
    TopicNode.find({ graphId: graph._id }).lean(),
    TopicEdge.find({ _id: { $in: graph.edges } }).lean(),
  ]);

  const topicsById = new Map(topics.map((topic) => [topic._id.toString(), topic]));
  const prerequisitesOf = new Map<string, string[]>();
  for (const edge of edges) {
    const target = edge.target.toString();
    prerequisitesOf.set(target, [
      ...(prerequisitesOf.get(target) ?? []),
      edge.source.toString(),
    ]);
  }

  return {
    graph,
    documentName: document.name,
    topics,
    topicsById,
    prerequisitesOf,
    labelOf: (id: string) => topicsById.get(id)?.label ?? "this topic",
  };
}

export type GraphContext = Awaited<ReturnType<typeof loadGraph>>;

async function masteryByTopic(userId: UserId, graphId: mongoose.Types.ObjectId) {
  const records = await TopicMastery.find({ userId, graphId }).lean();
  return new Map(records.map((record) => [record.topicId.toString(), record]));
}

/** Harder questions as the student shows they know the topic. */
function difficultyFor(record?: { correct: number; incorrect: number }): QuestionDifficulty {
  if (!record || record.correct + record.incorrect === 0) return "medium";
  const score = masteryScore(record.correct, record.incorrect);
  if (score >= 0.8) return "hard";
  if (score < 0.5) return "easy";
  return "medium";
}

/**
 * Topics the exam might reach: the targets, then their prerequisites nearest
 * first (the planner only ever moves from a topic to its prerequisites).
 * Twice as many as the budget can cover, so the adaptive path has room.
 */
function bankTopics(context: GraphContext, targets: string[], questionBudget: number) {
  const limit = Math.max(targets.length, (questionBudget / QUESTIONS_PER_TOPIC) * 2);
  const picked = [...targets];
  const queue = [...targets];
  for (let i = 0; i < queue.length && picked.length < limit; i++) {
    for (const parent of context.prerequisitesOf.get(queue[i]) ?? []) {
      if (picked.length >= limit) break;
      if (!picked.includes(parent)) {
        picked.push(parent);
        queue.push(parent);
      }
    }
  }
  return picked;
}

/**
 * Writes the exam's whole question bank with one Gemini call, grounded in
 * chunks retrieved for each topic (RAG), and stores it.
 */
async function buildQuestionBank(
  context: GraphContext,
  topicIds: string[],
  userId: UserId,
  signal?: AbortSignal,
) {
  const [mastery, previous] = await Promise.all([
    masteryByTopic(userId, context.graph._id),
    Question.find({ topicId: { $in: topicIds } }).select("topicId prompt").lean(),
  ]);

  const requests = await Promise.all(
    topicIds.map(async (topicId) => {
      const topic = context.topicsById.get(topicId)!;
      const query = [
        topic.label,
        topic.description,
        ...(topic.learningObjectives ?? []),
      ].join("\n");
      return {
        topicId,
        label: topic.label,
        description: topic.description,
        learningObjectives: topic.learningObjectives ?? [],
        misconceptions: topic.misconceptions ?? [],
        difficulty: difficultyFor(mastery.get(topicId)),
        count: QUESTIONS_PER_TOPIC,
        chunks: await retrieveChunks(context.graph.documentId, query, { limit: 3, signal }),
        avoid: previous
          .filter((question) => question.topicId.toString() === topicId)
          .slice(-6)
          .map((question) => question.prompt),
      };
    }),
  );

  const generated = await generateExamQuestions(requests, { signal });
  const difficultyOf = new Map(requests.map((request) => [request.topicId, request.difficulty]));

  return Question.insertMany(
    generated.map((question) => ({
      graphId: context.graph._id,
      topicId: question.topicId,
      documentId: context.graph.documentId,
      prompt: question.prompt,
      options: question.options,
      correctOptionId: question.correctOptionId,
      explanation: question.explanation,
      difficulty: difficultyOf.get(question.topicId)!,
      sourceChunkIds: question.sourceChunkIds,
      sourcePages: context.topicsById.get(question.topicId)?.sourcePages ?? [],
      generationModel: GENERATION_MODEL,
    })),
  );
}

/** Key topics: the most important ones, as the default exam targets. */
function defaultTargets(context: GraphContext) {
  return [...context.topics]
    .sort((a, b) => (b.importance ?? 0.5) - (a.importance ?? 0.5))
    .slice(0, DEFAULT_TARGETS)
    .map((topic) => topic._id.toString());
}

/** Bank questions on each topic this exam hasn't asked yet, in order. */
async function unaskedByTopic(assessment: AssessmentDocument) {
  const asked = new Set(assessment.answers.map((answer) => answer.questionId.toString()));
  // Exams saved without a bank (e.g. by a server running an older schema)
  // fall back to every question written for the graph, so they can finish.
  const bank = await Question.find(
    assessment.questionIds?.length
      ? { _id: { $in: assessment.questionIds } }
      : { graphId: assessment.graphId },
  )
    .sort({ createdAt: 1 })
    .select("topicId")
    .lean();
  const byTopic = new Map<string, mongoose.Types.ObjectId[]>();
  for (const question of bank) {
    if (asked.has(question._id.toString())) continue;
    const topicId = question.topicId.toString();
    byTopic.set(topicId, [...(byTopic.get(topicId) ?? []), question._id]);
  }
  return byTopic;
}

function plan(
  assessment: AssessmentDocument,
  context: GraphContext,
  unasked: Map<string, mongoose.Types.ObjectId[]>,
) {
  return planNext({
    pending: assessment.pending.map((entry) => ({
      topicId: entry.topicId.toString(),
      reason: entry.reason,
    })),
    answers: assessment.answers.map((answer) => ({
      topicId: answer.topicId.toString(),
      correct: answer.correct,
    })),
    questionBudget: assessment.questionBudget,
    prerequisitesOf: context.prerequisitesOf,
    labelOf: context.labelOf,
    hasQuestion: (topicId) => (unasked.get(topicId)?.length ?? 0) > 0,
  });
}

/**
 * Moves the exam on: picks the next topic and a question on it from the bank,
 * or marks the exam completed. No Gemini call; planning is idempotent.
 */
async function advance(assessment: AssessmentDocument, context: GraphContext) {
  const unasked = await unaskedByTopic(assessment);
  const { pending, next } = plan(assessment, context, unasked);
  assessment.set("pending", pending);

  if (next) {
    assessment.currentQuestionId = unasked.get(next.topicId)![0];
    assessment.currentReason = next.reason;
  } else {
    assessment.currentQuestionId = null;
    assessment.currentReason = null;
    assessment.status = "completed";
    assessment.completedAt = new Date();
  }
  await assessment.save();
}

async function buildResults(
  assessment: AssessmentDocument,
  context: GraphContext,
  userId: UserId,
): Promise<AssessmentResults> {
  const mastery = await masteryByTopic(userId, context.graph._id);
  const statusOf = (id: string) => {
    const record = mastery.get(id);
    return masteryStatus(record?.correct ?? 0, record?.incorrect ?? 0);
  };
  const scoreOf = (id: string) => {
    const record = mastery.get(id);
    return masteryScore(record?.correct ?? 0, record?.incorrect ?? 0);
  };

  const exam = new Map<string, { correct: number; total: number }>();
  for (const answer of assessment.answers) {
    const id = answer.topicId.toString();
    const entry = exam.get(id) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (answer.correct) entry.correct += 1;
    exam.set(id, entry);
  }

  const topics = [...exam].map(([id, stats]) => {
    const record = mastery.get(id);
    return {
      topicId: id,
      label: context.labelOf(id),
      examCorrect: stats.correct,
      examTotal: stats.total,
      mastery: scoreOf(id),
      evidence: (record?.correct ?? 0) + (record?.incorrect ?? 0),
      status: statusOf(id),
    };
  });

  const gaps: GapAnalysis[] = assessment.targetTopicIds.map((objectId) => {
    const targetId = objectId.toString();
    const target = context.labelOf(targetId);
    const ancestors = ancestorsOf(targetId, context.prerequisitesOf);
    const weak = ancestors
      .filter((id) => ["weak", "developing"].includes(statusOf(id)))
      .map((id) => ({ id, label: context.labelOf(id), mastery: scoreOf(id) }));
    const unmeasured = ancestors
      .filter((id) => statusOf(id) === "unmeasured")
      .map((id) => ({ id, label: context.labelOf(id) }));
    const targetStatus = statusOf(targetId);

    // A hypothesis to test, not proof of cause: the graph plus the answers.
    let recommendation: string;
    if (weak.length > 0) {
      recommendation = `${weak[0].label} is a prerequisite of ${target} and your score there is low. Review ${weak[0].label} first, then come back to ${target}.`;
    } else if (targetStatus === "mastered") {
      recommendation = `You've got ${target}. Move on to the topics it unlocks.`;
    } else if (unmeasured.length > 0) {
      recommendation = `${target} needs more work, and some of its prerequisites haven't been tested yet. Take another exam targeting ${target} to find the gap.`;
    } else if (targetStatus === "unmeasured") {
      recommendation = `There isn't enough evidence on ${target} yet. Take another exam to measure it.`;
    } else {
      recommendation = `Its prerequisites look solid, so practise ${target} itself and test again.`;
    }

    return { targetId, targetLabel: target, targetStatus, weak, unmeasured, recommendation };
  });

  return { topics, gaps, calibration: calibrate(assessment.answers) };
}

async function buildView(
  assessment: AssessmentDocument,
  context: GraphContext,
  userId: UserId,
): Promise<AssessmentView> {
  const question = assessment.currentQuestionId
    ? await Question.findById(assessment.currentQuestionId).lean()
    : null;

  return {
    id: assessment._id.toString(),
    graphId: assessment.graphId.toString(),
    documentName: context.documentName,
    status: assessment.status,
    questionBudget: assessment.questionBudget,
    answeredCount: assessment.answers.length,
    correctCount: assessment.answers.filter((answer) => answer.correct).length,
    current: question
      ? {
          id: question._id.toString(),
          number: assessment.answers.length + 1,
          topicId: question.topicId.toString(),
          topicLabel: context.labelOf(question.topicId.toString()),
          reason: assessment.currentReason ?? "",
          prompt: question.prompt,
          options: question.options.map(({ id, text }) => ({ id, text })),
          difficulty: question.difficulty,
        }
      : null,
    results:
      assessment.status === "completed"
        ? await buildResults(assessment, context, userId)
        : null,
    createdAt: assessment.createdAt.toISOString(),
  };
}

async function findOwnAssessment(assessmentId: string, userId: UserId) {
  const assessment = mongoose.isValidObjectId(assessmentId)
    ? await Assessment.findOne({ _id: assessmentId, userId })
    : null;
  if (!assessment) {
    throw new AppError("Assessment not found", HttpStatusCode.NOT_FOUND);
  }
  return assessment;
}

export async function startAssessment(
  userId: UserId,
  input: StartAssessmentInput,
  signal?: AbortSignal,
): Promise<AssessmentView> {
  const context = await loadGraph(input.graphId, userId);

  if (input.targetTopicId && !context.topicsById.has(input.targetTopicId)) {
    throw new AppError("Validation failed", HttpStatusCode.BAD_REQUEST, true, {
      targetTopicId: "This topic isn't in the selected graph",
    });
  }
  const targets = input.targetTopicId
    ? [input.targetTopicId]
    : defaultTargets(context);

  const assessment = new Assessment({
    userId,
    graphId: context.graph._id,
    documentId: context.graph.documentId,
    targetTopicIds: targets,
    questionBudget: input.questionBudget,
    pending: targets.map((topicId) => ({
      topicId,
      reason: input.targetTopicId
        ? "Your target topic"
        : `${context.labelOf(topicId)} is one of the key topics in this document`,
    })),
  });

  // Write the whole exam before saving, so a Gemini failure doesn't leave an
  // empty exam behind.
  const bank = await buildQuestionBank(
    context,
    bankTopics(context, targets, input.questionBudget),
    userId,
    signal,
  );
  assessment.questionIds = bank.map((question) => question._id);
  await advance(assessment, context);

  return buildView(assessment, context, userId);
}

/** The exam's current question, or its results once finished. */
export async function getAssessment(
  assessmentId: string,
  userId: UserId,
): Promise<AssessmentView> {
  const assessment = await findOwnAssessment(assessmentId, userId);
  const context = await loadGraph(assessment.graphId, userId);
  return buildView(assessment, context, userId);
}

export async function answerQuestion(
  assessmentId: string,
  userId: UserId,
  input: AnswerInput,
): Promise<AnswerFeedback> {
  const assessment = await findOwnAssessment(assessmentId, userId);
  if (assessment.status === "completed") {
    throw new AppError("This exam is already finished", HttpStatusCode.CONFLICT);
  }
  if (assessment.currentQuestionId?.toString() !== input.questionId) {
    throw new AppError(
      "This question was already answered; reload the exam",
      HttpStatusCode.CONFLICT,
    );
  }

  const question = await Question.findById(input.questionId).lean();
  if (!question) {
    throw new AppError("Question not found", HttpStatusCode.NOT_FOUND);
  }
  const context = await loadGraph(assessment.graphId, userId);

  // Checked on the server; the client never sees the answer beforehand.
  const correct = input.optionId === question.correctOptionId;
  assessment.answers.push({
    questionId: question._id,
    topicId: question.topicId,
    selectedOptionId: input.optionId,
    correct,
    confidence: input.confidence,
    answeredAt: new Date(),
  });
  await TopicMastery.updateOne(
    { userId, topicId: question.topicId },
    {
      $inc: { correct: correct ? 1 : 0, incorrect: correct ? 0 : 1 },
      $setOnInsert: { graphId: assessment.graphId },
    },
    { upsert: true },
  );

  // The next question comes from the bank, so the feedback carries it.
  await advance(assessment, context);

  const sources = await Embedding.find({ _id: { $in: question.sourceChunkIds } })
    .select("content lines")
    .lean();

  return {
    correct,
    selectedOptionId: input.optionId,
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
    misconception: correct
      ? null
      : (question.options.find((option) => option.id === input.optionId)
          ?.misconception ?? null),
    sourcePages: question.sourcePages ?? [],
    sources: sources.map((chunk) => ({
      id: chunk._id.toString(),
      excerpt:
        chunk.content.length > EXCERPT_LENGTH
          ? `${chunk.content.slice(0, EXCERPT_LENGTH).trimEnd()}…`
          : chunk.content,
      lines: { from: chunk.lines?.from ?? 1, to: chunk.lines?.to ?? 1 },
    })),
    assessment: await buildView(assessment, context, userId),
  };
}

export async function listAssessments(userId: UserId): Promise<AssessmentSummary[]> {
  const assessments = await Assessment.find({ userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  const documents = await Document.find({
    _id: { $in: assessments.map((assessment) => assessment.documentId) },
  })
    .select("name")
    .lean();
  const names = new Map(documents.map((document) => [document._id.toString(), document.name]));

  return assessments.map((assessment) => ({
    id: assessment._id.toString(),
    graphId: assessment.graphId.toString(),
    documentName: names.get(assessment.documentId.toString()) ?? "Deleted document",
    status: assessment.status,
    questionBudget: assessment.questionBudget,
    answeredCount: assessment.answers.length,
    correctCount: assessment.answers.filter((answer) => answer.correct).length,
    createdAt: assessment.createdAt.toISOString(),
  }));
}
