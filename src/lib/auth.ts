import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

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
      // Never let logging break a sign-in.
      try {
        const email = user.email ?? "unknown";
        await prisma.accessLog.create({
          data: { email, userId: user.id ?? null },
        });
        if (user.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });
        }
      } catch (err) {
        console.error("[accesslog] failed to record sign-in", err);
      }
    },
  },
  pages: {
    signIn: "/login",
  },
});
