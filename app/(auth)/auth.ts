import { compare } from "bcrypt-ts";
import NextAuth, { User, Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { getUserByEmail, createUser, getUserById } from "@/db/queries";

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
      
      // Validate password if it exists (for non-bot users)
      if ('password' in user && user.password && !user.isBot) {
        const isValid = await compare(password, user.password as string);
        if (!isValid) return null;
      }
      
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
          }
          return true;
        } catch (error) {
          // Throw the error so NextAuth can handle it properly
          throw error;
        }
      }
      return true;
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = (user as any)._id?.toString() || user.id;
        token.email = user.email;
      }
      
      // Fetch user from database to get the MongoDB _id
      if (token.email && !token.id) {
        const dbUser = await getUserByEmail(token.email as string);
        if (dbUser && !Array.isArray(dbUser)) {
          token.id = (dbUser as any)._id?.toString();
        }
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
