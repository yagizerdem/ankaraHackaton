"use client";

import { useState } from "react";
import { Inter } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyholeIcon } from "lucide-react";
import { toast } from "sonner";

import { PasswordInput } from "@/app/(auth)/components/password-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createSignInSchema } from "@/domain/auth";
import { cn, zodErrorToFromErrors } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

import type { SignInResponse } from "@/domain/auth";
import type { FormErrors } from "@/error/app-error";
import type { ApiResponse } from "@/lib/api-response";

const signInSchema = createSignInSchema(undefined);

// The dialog portals out of the panel layout, so it needs the font itself.
const inter = Inter({ subsets: ["latin", "latin-ext"] });

/** Shown to signed-out visitors: a sign-in popup over a short explanation. */
export function SignInGate() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [open, setOpen] = useState(true);
  const [pending, setPending] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const parsed = signInSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setFormErrors(zodErrorToFromErrors(parsed.error));
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

      if (!response.ok || !body?.data) {
        if (body?.fromErrors) setFormErrors(body.fromErrors);
        setError(body?.message ?? "Couldn't sign in; try again");
        return;
      }

      const { user } = body.data;
      setUser({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        createdAt: user.createdAt,
      });
      toast.success("Signed in");
      setOpen(false);
      // The page reads the session on the server, so render it again.
      router.refresh();
    } catch {
      setError("Network error, check your connection");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-md flex-col items-center gap-3 rounded-xl bg-surface-container px-6 py-10 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
          <LockKeyholeIcon className="size-5" />
        </span>
        <h2 className="text-title-md text-on-surface">
          Sign in to see your uploads
        </h2>
        <p className="text-body-sm text-on-surface-variant">
          Your documents and their knowledge graphs are tied to your account.
        </p>
        <Button type="button" onClick={() => setOpen(true)} className="mt-1">
          Sign in
        </Button>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn(inter.className, "sm:max-w-sm")}>
          <DialogHeader>
            <DialogTitle>Sign in</DialogTitle>
            <DialogDescription>
              Sign in to see and upload your documents.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} noValidate>
            <FieldGroup>
              <Field data-invalid={!!formErrors.email}>
                <FieldLabel htmlFor="gate-email">Email</FieldLabel>
                <Input
                  id="gate-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!formErrors.email}
                  className="border-foreground/20 dark:border-foreground/25"
                />
                <FieldError>{formErrors.email}</FieldError>
              </Field>
              <Field data-invalid={!!formErrors.password}>
                <FieldLabel htmlFor="gate-password">Password</FieldLabel>
                <PasswordInput
                  id="gate-password"
                  name="password"
                  autoComplete="current-password"
                  aria-invalid={!!formErrors.password}
                />
                <FieldError>{formErrors.password}</FieldError>
              </Field>
              {error && <FieldError role="alert">{error}</FieldError>}
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                No account?{" "}
                <Link href="/signup" className="underline">
                  Sign up
                </Link>
              </p>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
