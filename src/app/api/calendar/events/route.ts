import { auth } from "@/lib/auth";
import { createClassEvent } from "@/lib/googleCalendar";
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

  return NextResponse.json(event, { status: 201 });
}
