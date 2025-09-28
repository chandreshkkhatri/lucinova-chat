"use server";

import { hash } from "bcrypt-ts";
import { AuthError } from "next-auth";
import { z } from "zod";

import { createUser, getUserByEmail } from "@/db/queries";

import { signIn } from "./auth";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
}

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const result = await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    if (result && "error" in result && result.error) {
      return { status: "failed" };
    }

    return { status: "success" };
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "failed" };
    }
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

export interface RegisterActionState {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
}

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const existing = await getUserByEmail(validatedData.email);
    if (existing) {
      return { status: "user_exists" } as RegisterActionState;
    }

    // Hash the password before storing
    const hashedPassword = await hash(validatedData.password, 10);
    await createUser(validatedData.email, hashedPassword);

    const result = await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    if (result && "error" in result && result.error) {
      return { status: "failed" };
    }

    return { status: "success" };
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "failed" };
    }
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    console.error("Registration error:", error);
    return { status: "failed" };
  }
};
