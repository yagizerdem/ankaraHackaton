"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type * as z from "zod";
import type { FromErrors } from "@/error/app-error";
import { zodErrorToFromErrors } from "@/lib/utils";

/**
 * Validates the submitted form with `schema`, POSTs it to `endpoint` as JSON
 * and redirects on success. Field errors (from zod or from the API's
 * fromErrors) land in `errors`; anything else lands in `formError`.
 */
export function useAuthForm<T>(
  schema: z.ZodType<T>,
  endpoint: string,
  redirectTo = "/",
) {
  const router = useRouter();
  const [errors, setErrors] = React.useState<FromErrors>({});
  const [formError, setFormError] = React.useState<string>();
  const [pending, setPending] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    // Empty inputs become undefined so optional fields pass validation.
    const values = Object.fromEntries(
      [...new FormData(event.currentTarget)].map(([key, value]) => [
        key,
        value === "" ? undefined : value,
      ]),
    );

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodErrorToFromErrors(parsed.error));
      return;
    }
    setErrors({});

    setPending(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (response.ok) {
        router.push(redirectTo);
        return;
      }

      const body = await response.json().catch(() => null);
      if (body?.fromErrors) setErrors(body.fromErrors);
      setFormError(body?.message ?? "Something went wrong");
    } catch {
      setFormError("Network error, please try again");
    } finally {
      setPending(false);
    }
  }

  return { errors, formError, pending, onSubmit };
}
