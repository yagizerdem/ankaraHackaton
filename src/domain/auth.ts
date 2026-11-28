import * as z from "zod";

export function createSignInSchema(data: unknown) {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });
  return schema;
}

export function createSignUpSchema(data: unknown) {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    username: z.string().min(3),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
  });
  return schema;
}

export function createSignUpFormSchema(data: unknown) {
  return createSignUpSchema(data)
    .extend({
      confirmPassword: z.string({ error: "Please confirm your password" }),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ["confirmPassword"],
      error: "Passwords do not match",
    });
}

export type SignInInput = z.infer<ReturnType<typeof createSignInSchema>>;
export type SignUpInput = z.infer<ReturnType<typeof createSignUpSchema>>;

export interface SignUpResponse {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
}

export interface SignInResponse {
  user: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: Date;
  };
  expiresAt: Date;
}

export interface MeResponse {
  user: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt: Date;
  };
  expiresAt: Date;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
}
