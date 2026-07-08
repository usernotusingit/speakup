import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClassEvent } from "@/lib/googleCalendar";
import { NextRequest, NextResponse } from "next/server";

// Teacher decision on a pending booking request. `accept` writes the real Google
// Calendar event (inviting the student) and confirms the booking; `decline`
// marks it declined, which reopens the slot (only active bookings hold a slot).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user as { role?: string }).role !== "teacher"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.status !== "pending") {
    return NextResponse.json(
      { error: "This request was already handled." },
      { status: 409 }
    );
  }

  if (action === "decline") {
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "declined" },
    });
    return NextResponse.json(updated);
  }

  // accept
  const event = await createClassEvent(session.user.id, {
    summary: booking.summary,
    startDateTime: booking.start.toISOString(),
    endDateTime: booking.end.toISOString(),
    attendeeEmails: [booking.studentEmail],
  });
  if (!event) {
    return NextResponse.json(
      { error: "Couldn't create the calendar event. Try again." },
      { status: 500 }
    );
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "confirmed", googleEventId: event.id },
  });
  return NextResponse.json(updated);
}
