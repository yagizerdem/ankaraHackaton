import type * as z from "zod";
import type { FromErrors } from "@/error/app-error";

export { cn } from "cn";

export function zodErrorToFromErrors(
  error: z.ZodError,
  rootKey = "body",
): FromErrors {
  const fromErrors: FromErrors = {};
  for (const issue of error.issues) {
    const field = issue.path.map(String).join(".") || rootKey;
    fromErrors[field] ??= issue.message;
  }
  return fromErrors;
}
