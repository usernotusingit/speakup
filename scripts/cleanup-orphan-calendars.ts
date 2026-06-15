/**
 * One-off: clear speakupCalendarId for any user who is not a teacher.
 *
 * Fixes the orphaned-calendar case where a user was a teacher (got a calendar),
 * then was re-derived to "student" but kept the now-stale calendar id.
 *
 * The actual Google calendar is intentionally NOT deleted — non-destructive.
 *
 * Run with:  npx tsx scripts/cleanup-orphan-calendars.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db" }),
});

async function main() {
  const orphans = await prisma.user.findMany({
    where: { role: { not: "teacher" }, speakupCalendarId: { not: null } },
    select: { id: true, email: true },
  });

  if (orphans.length === 0) {
    console.log("No orphaned calendars found.");
    return;
  }

  console.log(`Clearing speakupCalendarId for ${orphans.length} non-teacher user(s):`);
  for (const o of orphans) console.log(`  - ${o.email}`);

  const res = await prisma.user.updateMany({
    where: { role: { not: "teacher" }, speakupCalendarId: { not: null } },
    data: { speakupCalendarId: null },
  });

  console.log(`Done. Updated ${res.count} user(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
