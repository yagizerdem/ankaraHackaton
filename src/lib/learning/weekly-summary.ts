import { GENERATION_MODEL, getGeminiClient } from "@/lib/ai/gemini";

import type { WeeklyStats } from "@/lib/learning/report";

/**
 * A three-sentence personal note on the student's week, written by Gemini
 * from the numbers alone. Giving it only computed figures (and telling it to
 * use nothing else) keeps it from inventing progress.
 */
export async function writeWeeklySummary(
  studentName: string,
  documentName: string,
  stats: WeeklyStats,
  signal?: AbortSignal,
) {
  const response = await getGeminiClient().models.generateContent({
    model: GENERATION_MODEL,
    contents: `Write a short, warm note to a student about their last 7 days of studying "${documentName}".

Data (use only these facts; do not invent numbers, topics or events):
${JSON.stringify({ studentName, ...stats }, null, 2)}

Field meanings: answers/correct are exam answers this week; topics lists each
topic practised with correct/total; confidentMistakes counts answers the
student was sure about but got wrong; topMistake is their most repeated
misconception; sureAccuracy and guessAccuracy are the share right (0-1) when
sure or guessing, null if none; goal is their target topic and days left.

Rules:
- Exactly three sentences, second person, addressed to ${studentName}.
- Sentence 1: what went well, with a real number.
- Sentence 2: the most useful thing to fix (a weak topic, the top mistake or
  overconfidence), named specifically.
- Sentence 3: one concrete next step, tied to the goal if there is one.
- Only connect facts the data connects. confidentMistakes is a total across
  all topics; do not attribute it to topMistake or to one topic.
- If answers is 0, say they haven't practised this week and suggest a short
  exam to start.
- Plain text, no Markdown, no emoji, no greeting line.`,
    config: { abortSignal: signal },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Gemini returned an empty summary");
  return { text, model: GENERATION_MODEL };
}
