import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { recordLogin, recordDenied } from "@/lib/access";
import { lookupRoster } from "@/lib/roster";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      checks: ["state"],
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    // The access gate. This runs BEFORE the adapter creates a User, so an
    // email that is not on the roster never reaches the database at all.
    async signIn({ user }) {
      const entry = await lookupRoster(user.email);
      if (!entry) {
        await recordDenied(user.email ?? "unknown");
        return false;
      }
      return true;
    },
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = (user as { role?: string }).role ?? "student";
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) await recordLogin(user.id, user.email ?? "unknown");
    },
  },
  pages: {
    signIn: "/login",
  },
});
