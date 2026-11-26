"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createSignInSchema, type SignInResponse } from "@/domain/auth";
import type { FromErrors } from "@/error/app-error";
import type { ApiResponse } from "@/lib/api-response";
import { cameraFlashEffect, zodErrorToFromErrors } from "@/lib/utils";
import { PasswordInput } from "@/app/(auth)/components/password-input";
import { toast } from "sonner";
import { useAuth } from "@/providers/auth-provider";

const signInSchema = createSignInSchema(undefined);

export default function SignInPage() {
  const { setUser } = useAuth();
  const [formErrors, setFormErrors] = useState<FromErrors>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    // Empty inputs become undefined so optional fields pass validation.
    const values = Object.fromEntries(
      [...new FormData(event.currentTarget)].map(([key, value]) => [
        key,
        value === "" ? undefined : value,
      ]),
    );

    const parsed = signInSchema.safeParse(values);
    if (!parsed.success) {
      setFormErrors(zodErrorToFromErrors(parsed.error));
      toast.error("Please fix the errors in the form.");
      return;
    }
    setFormErrors({});

    setPending(true);
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const body: ApiResponse<SignInResponse> | null = await response
        .json()
        .catch(() => null);

      if (response.ok) {
        toast.success("Signed in successfully");
        setUser({
          createdAt: body?.data?.user?.createdAt ?? new Date(),
          email: body?.data?.user?.email ?? "",
          id: body?.data?.user?.id ?? "",
          username: body?.data?.user?.username ?? "",
          firstName: body?.data?.user?.firstName ?? "",
          lastName: body?.data?.user?.lastName ?? "",
        });
        router.push("/");
        cameraFlashEffect();
        return;
      }

      if (body?.fromErrors) setFormErrors(body.fromErrors);
      setError(body?.message ?? "Something went wrong");
      toast.error(body?.message ?? "Something went wrong");
    } catch {
      setError("Network error, please try again");
      toast.error("Network error, please try again");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="shadow-xl shadow-black/10 dark:shadow-black/50">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your email and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="signin-form" onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={!!formErrors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                className="border-foreground/20 dark:border-foreground/25"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!formErrors.email}
              />
              <FieldError>{formErrors.email}</FieldError>
            </Field>
            <Field data-invalid={!!formErrors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                aria-invalid={!!formErrors.password}
              />
              <FieldError>{formErrors.password}</FieldError>
            </Field>
            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <Button
          type="submit"
          form="signin-form"
          className="w-full"
          disabled={pending}
        >
          {pending ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
