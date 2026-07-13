import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lookupRoster } from "@/lib/roster";
import { initSpeakupCalendar } from "@/lib/googleCalendar";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

/**
 * Only same-site paths are acceptable. Without this an attacker can send
 * students a speakupenglish.duckdns.org link that bounces them to any site.
 * "//evil.com" is protocol-relative and must be rejected too.
 */
function safeNext(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const next = safeNext(req.nextUrl.searchParams.get("next"));

  if (session?.user?.id && session.user.email) {
    // The roster is the source of truth for role. Sign-in already failed for
    // anyone not on it, so a missing entry here means it was revoked mid-session.
    const entry = await lookupRoster(session.user.email);
    const role = entry?.role === "teacher" ? "teacher" : "student";

    await prisma.user.update({
      where: { id: session.user.id },
      data: { role },
    });

    if (role === "teacher") {
      await initSpeakupCalendar(session.user.id);
    } else {
      // Self-heal: a former teacher demoted to student should not keep a stale
      // calendar id pointing at a calendar they no longer manage.
      await prisma.user.update({
        where: { id: session.user.id },
        data: { speakupCalendarId: null },
      });
    }
  }

  redirect(next);
}
