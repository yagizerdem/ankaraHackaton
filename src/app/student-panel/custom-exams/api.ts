import HttpStatusCode from "@/lib/http-status-code";

import type {
  CustomExam,
  CustomExamInput,
  DeleteCustomExamResponse,
} from "@/domain/custom-exam";
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

export function createExam(body: CustomExamInput) {
  return request<CustomExam>(
    "/api/custom-exams",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "Couldn't write the exam, try again",
  );
}

export function deleteExam(id: string) {
  return request<DeleteCustomExamResponse>(
    `/api/custom-exams/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Couldn't delete the exam, try again",
  );
}
