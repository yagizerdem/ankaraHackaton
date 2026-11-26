"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { createSignUpFormSchema, type SignUpResponse } from "@/domain/auth";
import type { FormErrors } from "@/error/app-error";
import type { ApiResponse } from "@/lib/api-response";
import { cameraFlashEffect, zodErrorToFromErrors } from "@/lib/utils";
import { PasswordInput } from "@/app/(auth)/components/password-input";
import { toast } from "sonner";

const signUpSchema = createSignUpFormSchema(undefined);

const fields = [
  {
    name: "username",
    label: "Username",
    type: "text",
    autoComplete: "username",
  },
  {
    name: "firstName",
    label: "First name",
    type: "text",
    autoComplete: "given-name",
  },
  {
    name: "lastName",
    label: "Last name",
    type: "text",
    autoComplete: "family-name",
  },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    label: "Password again",
    type: "password",
    autoComplete: "new-password",
  },
] as const;

export default function SignUpPage() {
  const router = useRouter();
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Empty inputs become undefined so optional fields pass validation.
    const values = Object.fromEntries(
      [...new FormData(event.currentTarget)].map(([key, value]) => [
        key,
        value === "" ? undefined : value,
      ]),
    );

    const parsed = signUpSchema.safeParse(values);
    if (!parsed.success) {
      setFormErrors(zodErrorToFromErrors(parsed.error));
      toast.error("Please fix the errors in the form.");
      return;
    }
    setFormErrors({});

    setPending(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (response.ok) {
        router.push("/signin");
        toast.success("Account created successfully");
        cameraFlashEffect();
        return;
      }

      const body: ApiResponse<SignUpResponse> | null = await response
        .json()
        .catch(() => null);
      if (body?.fromErrors) setFormErrors(body.fromErrors);
      setError(body?.error ?? "Something went wrong");
      toast.error(body?.error ?? "Something went wrong");
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="shadow-xl shadow-black/10 dark:shadow-black/50">
      <CardHeader>
        <CardTitle>Sign up</CardTitle>
        <CardDescription>Create an account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="signup-form" onSubmit={onSubmit} noValidate>
          <FieldGroup>
            {fields.map(({ name, label, type, autoComplete }) => (
              <Field key={name} data-invalid={!!formErrors[name]}>
                <FieldLabel htmlFor={name}>{label}</FieldLabel>
                {type === "password" ? (
                  <PasswordInput
                    id={name}
                    name={name}
                    autoComplete={autoComplete}
                    aria-invalid={!!formErrors[name]}
                  />
                ) : (
                  <Input
                    className="border-foreground/20 dark:border-foreground/25"
                    id={name}
                    name={name}
                    type={type}
                    autoComplete={autoComplete}
                    aria-invalid={!!formErrors[name]}
                  />
                )}
                <FieldError>{formErrors[name]}</FieldError>
              </Field>
            ))}
            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <Button
          type="submit"
          form="signup-form"
          className="w-full"
          disabled={pending}
        >
          {pending ? "Creating account..." : "Sign up"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/signin" className="underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
