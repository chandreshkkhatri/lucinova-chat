import { compare } from "bcrypt-ts";
import { cookies } from "next/headers";
import NextAuth, { User, Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { getUserByEmail, createUser, getUserById } from "@/db/queries";
import { getUserByReferralCode, processReferral } from "@/lib/referral";

import { authConfig } from "./auth.config";

interface ExtendedSession extends Session {
  user: User;
}

// Only add Google provider if credentials are configured
const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

providers.push(
  Credentials({
    credentials: {},
    async authorize({ email, password }: any) {
      const user = await getUserByEmail(email);
      if (!user || Array.isArray(user)) return null;

      // Block credential login for OAuth-only accounts (no password set)
      if (!('password' in user) || !user.password) return null;

      // Skip password check for bot accounts
      if (user.isBot) return null;

      const isValid = await compare(password, user.password as string);
      if (!isValid) return null;

      return user as any;
    },
  })
);

const nextAuthConfig = {
  ...authConfig,
  providers,
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider === "google") {
        try {
          if (!user.email) {
            throw new Error("Google account does not have an email address");
          }
          
          // Check if user exists by email
          const existingUser = await getUserByEmail(user.email);
          
          if (!existingUser) {
            // Create new user for Google OAuth
            const newUser = await createUser(
              user.email,
              undefined, // No password for OAuth users
              user.name || undefined,
              user.image || undefined,
              false,
              "google",
              account.providerAccountId
            );

            // Process referral if cookie exists
            try {
              const cookieStore = await cookies();
              const referralCode = cookieStore.get("referral_code")?.value;
              if (referralCode) {
                const referrer = await getUserByReferralCode(referralCode);
                if (referrer?.email) {
                  await processReferral(referrer.email, user.email);
                }
                cookieStore.delete("referral_code");
              }
            } catch (err) {
              console.error("[OAuth] Referral processing error:", err);
            }
          }
          return true;
        } catch (error) {
          // Throw the error so NextAuth can handle it properly
          throw error;
        }
      }
      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        // If we have a user object (sign in), try to get the _id
        const dbId = (user as any)._id?.toString();
        if (dbId) {
          token.id = dbId;
        } else if (user.email) {
          // Fallback: fetch from DB if _id is missing but email is present
          const dbUser = await getUserByEmail(user.email);
          if (dbUser && !Array.isArray(dbUser)) {
            token.id = (dbUser as any)._id?.toString();
          }
        }
        
        // If still no hex ID (24 chars), it might be a provider UUID we should avoid
        // but for now we've done our best to get the DB ID.
        token.email = user.email;
      }
      
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(nextAuthConfig);
