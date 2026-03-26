import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/server/db";
import { authProviders } from "./providers";

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db),
  providers: authProviders,
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow credentials sign-in without adapter interference
      if (account?.provider === "credentials") {
        return true;
      }
      return true;
    },
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      if (token.name) {
        session.user.name = token.name as string;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
      }
      return token;
    },
  },
};
