/** Below this many answers a topic is "unmeasured", whatever the score. */
export const MIN_EVIDENCE = 3;
const MASTERED_AT = 0.8;
const DEVELOPING_AT = 0.5;

export type MasteryStatus = "unmeasured" | "mastered" | "developing" | "weak";

/**
 * Beta-Bernoulli estimate with a uniform prior: (1 + correct) / (2 + total).
 * 8 correct and 2 incorrect gives 9/12 = 75%. It is the model's estimate,
 * not an exact measure of what the student knows.
 */
export function masteryScore(correct: number, incorrect: number) {
  return (1 + correct) / (2 + correct + incorrect);
}

/** Thresholds from the product spec; not scientifically calibrated. */
export function masteryStatus(correct: number, incorrect: number): MasteryStatus {
  if (correct + incorrect < MIN_EVIDENCE) return "unmeasured";
  const score = masteryScore(correct, incorrect);
  if (score >= MASTERED_AT) return "mastered";
  if (score >= DEVELOPING_AT) return "developing";
  return "weak";
}
