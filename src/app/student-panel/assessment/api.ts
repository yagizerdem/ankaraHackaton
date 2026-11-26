import HttpStatusCode from "@/lib/http-status-code";

import type {
  AnswerFeedback,
  AnswerInput,
  AssessmentView,
} from "@/domain/assessment";
import type { ApiResponse } from "@/lib/api-response";

async function request<T>(
  url: string,
  init: RequestInit,
  fallback: string,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, init);
    const json = (await response.json().catch(() => null)) as ApiResponse<T> | null;
    return (
      json ?? {
        message: fallback,
        error: fallback,
        httpStatusCode: response.status,
        isSuccess: false,
      }
    );
  } catch {
    return {
      message: "Network error, check your connection",
      error: "Network error, check your connection",
      httpStatusCode: HttpStatusCode.SERVICE_UNAVAILABLE,
      isSuccess: false,
    };
  }
}

export function startExam(body: {
  graphId: string;
  targetTopicId?: string;
  questionBudget: number;
}) {
  return request<AssessmentView>(
    "/api/assessments",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "Couldn't start the exam, try again",
  );
}

/** Also generates the next question when the exam is waiting for one. */
export function fetchExam(id: string) {
  return request<AssessmentView>(
    `/api/assessments/${encodeURIComponent(id)}`,
    { cache: "no-store" },
    "Couldn't load the exam, try again",
  );
}

export function submitAnswer(id: string, body: AnswerInput) {
  return request<AnswerFeedback>(
    `/api/assessments/${encodeURIComponent(id)}/answers`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "Couldn't check your answer, try again",
  );
}
