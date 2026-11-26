import HttpStatusCode from "@/lib/http-status-code";

import type {
  GoalInput,
  GoalResponse,
  ShareResponse,
  SummaryResponse,
} from "@/domain/learning-path";
import type { ApiResponse } from "@/lib/api-response";

async function send<T>(
  url: string,
  method: string,
  body: unknown,
  fallback: string,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
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

export const saveGoal = (input: GoalInput) =>
  send<GoalResponse>("/api/learning-path/goal", "PUT", input, "Couldn't save the goal");

export const clearGoal = (graphId: string) =>
  send<undefined>("/api/learning-path/goal", "DELETE", { graphId }, "Couldn't clear the goal");

export const writeSummary = (graphId: string) =>
  send<SummaryResponse>(
    "/api/learning-path/summary",
    "POST",
    { graphId },
    "Couldn't write the summary",
  );

export const createShareLink = (graphId: string) =>
  send<ShareResponse>("/api/learning-path/share", "POST", { graphId }, "Couldn't create the link");
