import * as z from "zod";

import { GENERATION_MODEL, getGeminiClient } from "@/lib/ai/gemini";

import type { RetrievedChunk } from "@/lib/rag/retrieve";
import type { QuestionDifficulty } from "@/models/question";

// Options are always a-d, sorted, so the client can label them by id.
const OPTION_IDS = ["a", "b", "c", "d"] as const;

const generatedSchema = z.object({
  questions: z.array(
    z.object({
      topicNumber: z
        .number()
        .int()
        .min(1)
        .describe("Number of the topic this question tests"),
      prompt: z.string().min(10).describe("The question, self-contained"),
      options: z
        .array(
          z.object({
            id: z.enum(OPTION_IDS),
            text: z.string().min(1),
            misconception: z
              .string()
              .nullable()
              .describe(
                "For a wrong option: the misconception behind it, copied word for word from the topic's list when one fits, else a short new one. Null for the correct option.",
              ),
          }),
        )
        .length(4)
        .describe("Exactly four options with ids a, b, c, d"),
      correctOptionId: z.enum(OPTION_IDS),
      explanation: z
        .string()
        .min(10)
        .describe("Why the correct option is right and the others are not"),
      usedSources: z
        .array(z.number().int().min(1))
        .describe("Numbers of the source excerpts the question relies on"),
    }),
  ),
});

export interface ExamTopicRequest {
  topicId: string;
  label: string;
  description: string;
  learningObjectives: string[];
  misconceptions: string[];
  difficulty: QuestionDifficulty;
  /** How many questions to write for this topic. */
  count: number;
  /** Chunks retrieved for this topic (RAG). */
  chunks: RetrievedChunk[];
  /** Earlier questions on the topic, so the model doesn't repeat them. */
  avoid: string[];
}

export interface GeneratedQuestion {
  topicId: string;
  prompt: string;
  options: { id: string; text: string; misconception: string | null }[];
  correctOptionId: string;
  explanation: string;
  /** Ids of the retrieved chunks the model said it used. */
  sourceChunkIds: string[];
}

function buildPrompt(topics: ExamTopicRequest[], sources: RetrievedChunk[]) {
  const sourceNumber = new Map(sources.map((chunk, i) => [chunk.id, i + 1]));

  const topicBlocks = topics
    .map((topic, i) => {
      const refs = topic.chunks.map((chunk) => sourceNumber.get(chunk.id)).join(", ");
      return `Topic ${i + 1}: ${topic.label}
Write ${topic.count} questions, difficulty ${topic.difficulty}.
Description: ${topic.description}
Learning objectives: ${topic.learningObjectives.join("; ") || "none listed"}
Common misconceptions: ${topic.misconceptions.join("; ") || "none listed"}
Relevant excerpts: ${refs || "none; use only the description"}${
        topic.avoid.length
          ? `\nDo not repeat these existing questions:\n${topic.avoid.map((p) => `  * ${p}`).join("\n")}`
          : ""
      }`;
    })
    .join("\n\n");

  const excerpts = sources.length
    ? sources.map((chunk, i) => `[${i + 1}] ${chunk.content}`).join("\n\n")
    : "(No excerpts were found.)";

  return `Write a multiple-choice exam for a student, covering the topics below.

${topicBlocks}

Source excerpts from the student's course material:
${excerpts}

Rules:
- Write exactly the requested number of questions for every topic, and set
  topicNumber to the topic each question tests.
- Ground each question in its topic's relevant excerpts. Do not test facts
  that are not in the excerpts or the topic description.
- Questions on the same topic must test different things.
- Exactly four options (a-d) and exactly one correct answer. Wrong options
  should be plausible; base them on the common misconceptions when possible.
- Vary which letter is correct.
- For every wrong option, name the misconception that would lead a student
  to pick it. Reuse the topic's misconception text exactly when it fits, so
  repeated mistakes can be counted. Use null for the correct option.
- easy checks recall, medium checks understanding, hard checks application.
- List the excerpt numbers you relied on in usedSources.
- Write plain text only: no LaTeX, no Markdown, no dollar signs. Use Unicode
  for maths (for example F = m·a, x², √2, π).
Return JSON matching the schema.`;
}

/**
 * Writes every question for an exam in a single Gemini call, grounded in the
 * chunks retrieved for each topic (RAG). Topics the model skipped simply get
 * fewer questions; throws only when nothing usable comes back.
 */
export async function generateExamQuestions(
  topics: ExamTopicRequest[],
  { signal }: { signal?: AbortSignal } = {},
): Promise<GeneratedQuestion[]> {
  // Topics share chunks, so number each chunk once across the whole prompt.
  const sources = [
    ...new Map(topics.flatMap((topic) => topic.chunks).map((c) => [c.id, c])).values(),
  ];

  const response = await getGeminiClient().models.generateContent({
    model: GENERATION_MODEL,
    contents: buildPrompt(topics, sources),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(generatedSchema),
      abortSignal: signal,
    },
  });

  const { questions } = generatedSchema.parse(JSON.parse(response.text ?? "null"));

  const perTopic = new Map<string, number>();
  const usable: GeneratedQuestion[] = [];
  for (const question of questions) {
    const topic = topics[question.topicNumber - 1];
    if (!topic) continue;
    // Drop extras beyond what was asked, and malformed option sets.
    const count = perTopic.get(topic.topicId) ?? 0;
    if (count >= topic.count) continue;
    if (new Set(question.options.map((option) => option.id)).size !== 4) continue;

    perTopic.set(topic.topicId, count + 1);
    usable.push({
      topicId: topic.topicId,
      prompt: question.prompt,
      options: [...question.options]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((option) => ({
          id: option.id,
          text: option.text,
          misconception:
            option.id === question.correctOptionId
              ? null
              : option.misconception?.trim() || null,
        })),
      correctOptionId: question.correctOptionId,
      explanation: question.explanation,
      sourceChunkIds: question.usedSources
        .map((n) => sources[n - 1]?.id)
        .filter((id): id is string => Boolean(id)),
    });
  }

  if (usable.length === 0) throw new Error("Gemini returned no usable questions");
  return usable;
}
