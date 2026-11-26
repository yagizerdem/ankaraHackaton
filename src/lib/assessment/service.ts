import mongoose from "mongoose";

import { AppError } from "@/error/app-error";
import { ancestorsOf, planNext } from "@/lib/assessment/adaptive";
import { generateQuestion } from "@/lib/assessment/generate-question";
import { masteryScore, masteryStatus } from "@/lib/assessment/mastery";
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
async function loadGraph(graphId: string | mongoose.Types.ObjectId, userId: UserId) {
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

type GraphContext = Awaited<ReturnType<typeof loadGraph>>;

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
 * A question on the topic the student hasn't seen: a cached one if there is
 * one, otherwise a new one generated from retrieved chunks (RAG).
 */
async function obtainQuestion(
  context: GraphContext,
  topicId: string,
  userId: UserId,
  signal?: AbortSignal,
) {
  const topic = context.topicsById.get(topicId);
  if (!topic) throw new Error(`Topic ${topicId} is not in the graph`);

  const [mastery, seen] = await Promise.all([
    TopicMastery.findOne({ userId, topicId }).lean(),
    Assessment.distinct("answers.questionId", { userId }),
  ]);
  const difficulty = difficultyFor(mastery ?? undefined);

  const cached = await Question.findOne({
    topicId,
    difficulty,
    _id: { $nin: seen },
  });
  if (cached) return cached;

  const existing = await Question.find({ topicId }).select("prompt").limit(10).lean();
  const query = [topic.label, topic.description, ...(topic.learningObjectives ?? [])].join("\n");
  const chunks = await retrieveChunks(context.graph.documentId, query, { signal });

  const generated = await generateQuestion(
    {
      label: topic.label,
      description: topic.description,
      learningObjectives: topic.learningObjectives ?? [],
      misconceptions: topic.misconceptions ?? [],
    },
    chunks,
    difficulty,
    { avoid: existing.map((question) => question.prompt), signal },
  );

  return Question.create({
    graphId: context.graph._id,
    topicId,
    documentId: context.graph.documentId,
    prompt: generated.prompt,
    options: generated.options,
    correctOptionId: generated.correctOptionId,
    explanation: generated.explanation,
    difficulty,
    sourceChunkIds: generated.sourceChunkIds,
    sourcePages: topic.sourcePages ?? [],
    generationModel: generated.model,
  });
}

/** Key topics: the most important ones, as the default exam targets. */
function defaultTargets(context: GraphContext) {
  return [...context.topics]
    .sort((a, b) => (b.importance ?? 0.5) - (a.importance ?? 0.5))
    .slice(0, DEFAULT_TARGETS)
    .map((topic) => topic._id.toString());
}

function plan(assessment: AssessmentDocument, context: GraphContext) {
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
  });
}

/**
 * Moves the exam on: picks the next topic, or marks the exam completed. With
 * `generate`, also attaches a question; otherwise the next GET does that, so
 * answering stays fast while the client prefetches the next question.
 * Planning is idempotent, so running it again after an answer is safe.
 */
async function advance(
  assessment: AssessmentDocument,
  context: GraphContext,
  userId: UserId,
  { generate, signal }: { generate: boolean; signal?: AbortSignal },
) {
  const { pending, next } = plan(assessment, context);
  assessment.set("pending", pending);
  assessment.currentQuestionId = null;
  assessment.currentReason = null;

  if (!next) {
    assessment.status = "completed";
    assessment.completedAt = new Date();
    await assessment.save();
    return;
  }

  assessment.currentReason = next.reason;
  await assessment.save();
  if (!generate) return;

  const question = await obtainQuestion(context, next.topicId, userId, signal);
  assessment.currentQuestionId = question._id;
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

  return { topics, gaps };
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

  // Generate the first question before saving, so a Gemini failure doesn't
  // leave an empty exam behind.
  const { pending, next } = plan(assessment, context);
  const question = await obtainQuestion(context, next!.topicId, userId, signal);
  assessment.set("pending", pending);
  assessment.currentQuestionId = question._id;
  assessment.currentReason = next!.reason;
  await assessment.save();

  return buildView(assessment, context, userId);
}

/**
 * The exam's current state. If an earlier step saved the plan but failed to
 * generate the question, this retries the generation.
 */
export async function getAssessment(
  assessmentId: string,
  userId: UserId,
  signal?: AbortSignal,
): Promise<AssessmentView> {
  const assessment = await findOwnAssessment(assessmentId, userId);
  const context = await loadGraph(assessment.graphId, userId);

  if (assessment.status === "in_progress" && !assessment.currentQuestionId) {
    await advance(assessment, context, userId, { generate: true, signal });
  }
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

  // Plans only; GET /api/assessments/[id] generates the next question.
  await advance(assessment, context, userId, { generate: false });

  const sources = await Embedding.find({ _id: { $in: question.sourceChunkIds } })
    .select("content lines")
    .lean();

  return {
    correct,
    selectedOptionId: input.optionId,
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
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
