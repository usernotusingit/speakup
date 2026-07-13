import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// A resumed session only counts as a new "visit" after this much idle time, so
// one continuous browsing session produces one row rather than one per page.
const VISIT_GAP_MS = 30 * 60 * 1000;

// Upper bound on how often lastSeenAt is rewritten while someone is actively
// browsing. Keeps page navigation to at most one write per user per interval.
const SEEN_THROTTLE_MS = 5 * 60 * 1000;

async function requestOrigin() {
  try {
    const h = await headers();
    return {
      ip:
        h.get("x-real-ip") ??
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        null,
      userAgent: h.get("user-agent") ?? null,
    };
  } catch {
    return { ip: null, userAgent: null };
  }
}

/** Record a fresh sign-in (OAuth round-trip completed). */
export async function recordLogin(userId: string, email: string) {
  try {
    const { ip, userAgent } = await requestOrigin();
    const now = new Date();
    await prisma.accessLog.create({
      data: { email, userId, event: "login", ip, userAgent },
    });
    // Stamp lastSeenAt too, so the page render that immediately follows the
    // redirect doesn't also log a "visit" for the same arrival.
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: now, lastSeenAt: now },
    });
  } catch (err) {
    console.error("[access] failed to record login", err);
  }
}

/**
 * Record an authenticated page view. Called from the app layout, so it sees
 * every gated navigation — including ones that reuse an existing session
 * cookie and therefore never trigger a login.
 */
export async function recordVisit(userId: string, email: string) {
  try {
    const now = new Date();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastSeenAt: true },
    });

    const idleMs = user?.lastSeenAt
      ? now.getTime() - user.lastSeenAt.getTime()
      : Number.POSITIVE_INFINITY;

    if (idleMs < SEEN_THROTTLE_MS) return;

    if (idleMs >= VISIT_GAP_MS) {
      const { ip, userAgent } = await requestOrigin();
      await prisma.accessLog.create({
        data: { email, userId, event: "visit", ip, userAgent },
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: now },
    });
  } catch (err) {
    console.error("[access] failed to record visit", err);
  }
}
