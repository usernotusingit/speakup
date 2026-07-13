import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { recordLogin } from "@/lib/access";

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
