/**
 * The roster as declared by the admin. Safe to re-run — it upserts, so it will
 * correct roles but never delete anyone the admin added later via /admin/access.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const url = `file:${path.resolve(process.cwd(), process.env.DATABASE_URL.slice(5))}`;
const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url }), log: ["error"] });

const ROSTER = [
  { email: "joperudi@gmail.com", role: "teacher", note: "admin / platform owner" },
  { email: "csopenclawmaxp@gmail.com", role: "student", note: "admin's student test account" },
  { email: "lgnaves@gmail.com", role: "teacher", note: "teacher" },
  { email: "analaura.alfo30@gmail.com", role: "teacher", note: "teacher" },
  { email: "luizeopmartins@gmail.com", role: "teacher", note: "teacher" },
  { email: "roydenm212@gmail.com", role: "teacher", note: "teacher" },
  { email: "anadribeiro5@gmail.com", role: "student", note: "existing student (pre-roster)" },
];

for (const e of ROSTER) {
  const r = await prisma.allowedEmail.upsert({
    where: { email: e.email },
    create: { ...e, status: "active" },
    update: { role: e.role, note: e.note },
  });
  // Keep the live User row's role in step with the roster.
  await prisma.user.updateMany({ where: { email: r.email }, data: { role: r.role } });
  console.log(`  ${r.email.padEnd(28)} ${r.role.padEnd(8)} ${r.status}`);
}

console.log(`\nRoster: ${await prisma.allowedEmail.count()} emails. Everyone else is refused.`);
