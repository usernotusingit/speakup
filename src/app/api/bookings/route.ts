import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Student-initiated booking request. Creates a `pending` Booking that the teacher
// must later accept (which writes the real Google Calendar event). Students have
// no write access to the teacher's calendar, so the Booking row is the source of
// truth until confirmation.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { teacherId, startISO, endISO, summary } = body;
  if (
    typeof teacherId !== "string" ||
    typeof startISO !== "string" ||
    typeof endISO !== "string"
  ) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const start = new Date(startISO);
  const end = new Date(endISO);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
  }
  if (start <= new Date()) {
    return NextResponse.json({ error: "Cannot book a past slot" }, { status: 400 });
  }

  const studentEmail = session.user.email.toLowerCase();

  // Gate: a student may only book with a teacher they're enrolled with.
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentEmail_teacherId: { studentEmail, teacherId } },
  });
  if (!enrollment) {
    return NextResponse.json(
      { error: "You are not enrolled with this teacher." },
      { status: 403 }
    );
  }

  // First request locks the slot: reject if an active (pending/confirmed) booking
  // already overlaps this time. Done inside a transaction to close the race
  // between two students requesting the same slot at once.
  try {
    const booking = await prisma.$transaction(async (tx) => {
      const clash = await tx.booking.findFirst({
        where: {
          teacherId,
          status: { in: ["pending", "confirmed"] },
          start: { lt: end },
          end: { gt: start },
        },
      });
      if (clash) return null;
      return tx.booking.create({
        data: {
          studentEmail,
          studentName: session.user.name ?? null,
          teacherId,
          start,
          end,
          summary:
            typeof summary === "string" && summary.trim()
              ? summary.trim().slice(0, 120)
              : "English Class",
          status: "pending",
        },
      });
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Slot no longer available" },
        { status: 409 }
      );
    }
    return NextResponse.json(booking, { status: 201 });
  } catch (e) {
    console.error("POST /api/bookings failed", e);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
