import { auth } from "@/lib/auth";
import { createClassEvent } from "@/lib/googleCalendar";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || (session.user as { role?: string }).role !== "teacher") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { summary, startDateTime, endDateTime, attendeeEmails } = body;

  if (!summary || !startDateTime || !endDateTime || !Array.isArray(attendeeEmails)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const event = await createClassEvent(session.user.id, {
    summary,
    startDateTime,
    endDateTime,
    attendeeEmails,
  });

  if (!event) {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }

  // Enroll each attendee with this teacher so the student's dashboard can resolve
  // which teacher calendars to read. Keyed by email since invitees may not have
  // a User row yet. De-duplicate emails to avoid redundant upserts.
  const teacherId = session.user.id;
  const emails = [
    ...new Set(
      (attendeeEmails as string[])
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  if (emails.length > 0) {
    await prisma.$transaction(
      emails.map((studentEmail) =>
        prisma.enrollment.upsert({
          where: { studentEmail_teacherId: { studentEmail, teacherId } },
          create: { studentEmail, teacherId },
          update: {},
        })
      )
    );
  }

  return NextResponse.json(event, { status: 201 });
}
