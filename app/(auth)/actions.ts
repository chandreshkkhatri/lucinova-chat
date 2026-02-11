"use server";

import { hash } from "bcrypt-ts";
import { AuthError } from "next-auth";
import { z } from "zod";

import { createUser, getUserByEmail } from "@/db/queries";
import { getUserByReferralCode, processReferral } from "@/lib/referral";

import { signIn } from "./auth";

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerFormSchema = authFormSchema.extend({
  acceptTerms: z.literal("true"),
  referralCode: z.string().optional(),
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

    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { status: "failed" };
        default:
          return { status: "failed" };
      }
    }
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    console.error("Login error:", error);
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
    | "invalid_data"
    | "terms_not_accepted";
}

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validatedData = registerFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      acceptTerms: formData.get("acceptTerms"),
      referralCode: formData.get("referralCode") || undefined,
    });

    const existing = await getUserByEmail(validatedData.email);
    if (existing) {
      return { status: "user_exists" } as RegisterActionState;
    }

    // Hash the password before storing
    const hashedPassword = await hash(validatedData.password, 10);
    await createUser(
      validatedData.email,
      hashedPassword,
      undefined, // displayName
      undefined, // avatarUrl
      false, // isBot
      null, // oauthProvider
      undefined, // oauthProviderId
      new Date() // termsAcceptedAt
    );

    // Process referral if a valid referral code was provided
    if (validatedData.referralCode) {
      try {
        const referrer = await getUserByReferralCode(validatedData.referralCode);
        if (referrer?.email) {
          await processReferral(referrer.email, validatedData.email);
        }
      } catch (err) {
        console.error("[Register] Referral processing error:", err);
      }
    }

    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "failed" };
    }
    if (error instanceof z.ZodError) {
      // Check if the error is specifically about terms not being accepted
      const termsError = error.issues.find((e) => e.path.includes("acceptTerms"));
      if (termsError) {
        return { status: "terms_not_accepted" };
      }
      return { status: "invalid_data" };
    }

    console.error("Registration error:", error);
    return { status: "failed" };
  }
};
