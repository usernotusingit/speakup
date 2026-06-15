/**
 * One-off: bootstrap Enrollment rows from existing Google Calendar events.
 *
 * For each teacher with a speakupCalendarId, reads their calendar (recent past +
 * future), collects attendee emails, and upserts an Enrollment per
 * (studentEmail, teacherId). This seeds the student->teacher mapping that
 * getStudentClassEvents now relies on. Going forward, /api/calendar/events keeps
 * enrollments in sync automatically.
 *
 * Requires valid Google tokens in the DB at run time.
 *
 * Run with:  npx tsx scripts/backfill-enrollments.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});

async function getAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account?.access_token) return null;

  const isExpired =
    account.expires_at != null && account.expires_at < Math.floor(Date.now() / 1000);
  if (!isExpired) return account.access_token;
  if (!account.refresh_token) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    },
  });
  return data.access_token as string;
}

async function main() {
  const teachers = await prisma.user.findMany({
    where: { role: "teacher", speakupCalendarId: { not: null } },
    select: { id: true, email: true, speakupCalendarId: true },
  });

  if (teachers.length === 0) {
    console.log("No teachers with calendars found.");
    return;
  }

  // Look back a year to capture recent classes as well as upcoming ones.
  const timeMin = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  let totalUpserts = 0;

  for (const teacher of teachers) {
    const token = await getAccessToken(teacher.id);
    if (!token) {
      console.warn(`Skipping ${teacher.email}: no usable access token.`);
      continue;
    }

    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(teacher.speakupCalendarId!)}/events`
    );
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("maxResults", "250");
    url.searchParams.set("singleEvents", "true");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.warn(`Skipping ${teacher.email}: events fetch failed (${res.status}).`);
      continue;
    }

    const data = await res.json();
    const emails = new Set<string>();
    for (const event of data.items ?? []) {
      for (const a of event.attendees ?? []) {
        if (a.email) emails.add(String(a.email).toLowerCase());
      }
    }

    console.log(`${teacher.email}: ${emails.size} distinct attendee email(s).`);

    for (const studentEmail of emails) {
      await prisma.enrollment.upsert({
        where: { studentEmail_teacherId: { studentEmail, teacherId: teacher.id } },
        create: { studentEmail, teacherId: teacher.id },
        update: {},
      });
      totalUpserts++;
    }
  }

  console.log(`Done. Upserted ${totalUpserts} enrollment(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
