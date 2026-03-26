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
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
};
