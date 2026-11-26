"use client";

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
import { createSignInSchema } from "@/domain/auth";
import { useAuthForm } from "@/hooks/use-auth-form";

const signInSchema = createSignInSchema(undefined);
export default function SignInPage() {
  const { errors, formError, pending, onSubmit } = useAuthForm(
    signInSchema,
    "/api/auth/signin",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your email and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="signin-form" onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
              />
              <FieldError>{errors.email}</FieldError>
            </Field>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
              />
              <FieldError>{errors.password}</FieldError>
            </Field>
            {formError && <FieldError>{formError}</FieldError>}
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
