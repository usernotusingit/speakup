import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initSpeakupCalendar } from "@/lib/googleCalendar";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

const teacherEmails = new Set(
  (process.env.TEACHER_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean)
);

export async function GET(req: NextRequest) {
  const session = await auth();
  const next = req.nextUrl.searchParams.get("next") ?? "/dashboard";

  if (session?.user?.id && session.user.email) {
    const role = teacherEmails.has(session.user.email) ? "teacher" : "student";

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
