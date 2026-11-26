import type { Confidence } from "@/models/assessment";

/** Fewer answers than this at a confidence level say nothing reliable. */
const MIN_ANSWERS = 3;
/** Picking at random among four options is right 25% of the time. */
const CHANCE = 0.25;

export interface CalibrationRow {
  confidence: Confidence;
  label: string;
  answers: number;
  correct: number;
  /** Share of correct answers, 0-1; null with no answers. */
  accuracy: number | null;
}

export interface Calibration {
  rows: CalibrationRow[];
  /** Plain-language observations; empty until there is enough data. */
  insights: string[];
  /** Answered "sure" but got it wrong: a likely misconception. */
  confidentMistakes: number;
}

const LABELS: Record<Confidence, string> = {
  sure: "Sure",
  unsure: "Unsure",
  guess: "Guessing",
};

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

/**
 * How well the student's confidence matches their results (metacognition).
 * Answers given before confidence was asked are left out.
 */
export function calibrate(
  answers: { confidence?: Confidence | null; correct: boolean }[],
): Calibration {
  const rows = (Object.keys(LABELS) as Confidence[]).map((confidence) => {
    const matching = answers.filter((answer) => answer.confidence === confidence);
    const correct = matching.filter((answer) => answer.correct).length;
    return {
      confidence,
      label: LABELS[confidence],
      answers: matching.length,
      correct,
      accuracy: matching.length ? correct / matching.length : null,
    };
  });
  const [sure, unsure, guess] = rows;

  const insights: string[] = [];
  if (sure.answers >= MIN_ANSWERS && sure.accuracy! < 0.75) {
    insights.push(
      `You got ${percent(sure.accuracy!)} right on questions you were sure about. Some topics feel familiar but need another look.`,
    );
  } else if (sure.answers >= MIN_ANSWERS && sure.accuracy! >= 0.9) {
    insights.push(
      `You got ${percent(sure.accuracy!)} right when you were sure. Your confidence is a good guide.`,
    );
  }
  if (guess.answers >= MIN_ANSWERS && guess.accuracy! >= 0.5) {
    insights.push(
      `You got ${percent(guess.accuracy!)} of your guesses right, well above the ${percent(CHANCE)} chance level. You know more than you think.`,
    );
  } else if (guess.answers >= MIN_ANSWERS && guess.accuracy! <= CHANCE) {
    insights.push(
      `Your guesses were right ${percent(guess.accuracy!)} of the time, about chance level. You read those topics correctly as ones to study.`,
    );
  }
  if (unsure.answers >= MIN_ANSWERS && unsure.accuracy! >= 0.75) {
    insights.push(
      `You got ${percent(unsure.accuracy!)} right even when unsure. Trust yourself a little more.`,
    );
  }

  return {
    rows,
    insights,
    confidentMistakes: sure.answers - sure.correct,
  };
}
