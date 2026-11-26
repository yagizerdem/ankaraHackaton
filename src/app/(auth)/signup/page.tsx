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
import { createSignUpSchema } from "@/domain/auth";
import { useAuthForm } from "@/hooks/use-auth-form";

const signUpSchema = createSignUpSchema(undefined);

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
] as const;

export default function SignUpPage() {
  const { errors, formError, pending, onSubmit } = useAuthForm(
    signUpSchema,
    "/api/auth/signup",
    "/signin",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign up</CardTitle>
        <CardDescription>Create an account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="signup-form" onSubmit={onSubmit} noValidate>
          <FieldGroup>
            {fields.map(({ name, label, type, autoComplete }) => (
              <Field key={name} data-invalid={!!errors[name]}>
                <FieldLabel htmlFor={name}>{label}</FieldLabel>
                <Input
                  id={name}
                  name={name}
                  type={type}
                  autoComplete={autoComplete}
                  aria-invalid={!!errors[name]}
                />
                <FieldError>{errors[name]}</FieldError>
              </Field>
            ))}
            {formError && <FieldError>{formError}</FieldError>}
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
