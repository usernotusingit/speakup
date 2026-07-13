import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

// Accounts we want called out by name in the report.
// Testers are invited via the Google OAuth consent screen (see testers.md).
const TRACKED = [
  { email: "luizeopmartins@gmail.com", label: "tester" },
  { email: "analaura.alfo30@gmail.com", label: "tester" },
  { email: "csopenclawmaxp@gmail.com", label: "own test student acct" },
];

const days = Number(process.argv[2] ?? 10);
const since = new Date(Date.now() - days * 864e5);

const url = `file:${path.resolve(process.cwd(), process.env.DATABASE_URL.slice(5))}`;
const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url }), log: ["error"] });

const fmt = (d) => (d ? d.toISOString().slice(0, 16).replace("T", " ") : "—");

const logins = await prisma.accessLog.groupBy({
  by: ["email"],
  where: { createdAt: { gte: since } },
  _count: { _all: true },
  _max: { createdAt: true },
  _min: { createdAt: true },
});
const byEmail = new Map(logins.map((l) => [l.email, l]));

console.log(`\nLogins in the last ${days} days (since ${fmt(since)} UTC)\n`);

console.log("TRACKED ACCOUNTS");
for (const { email, label } of TRACKED) {
  const l = byEmail.get(email);
  const who = `${email} (${label})`.padEnd(48);
  console.log(
    l
      ? `  ✅ ${who} ${String(l._count._all).padStart(3)} logins   first ${fmt(l._min.createdAt)}   last ${fmt(l._max.createdAt)}`
      : `  ⏳ ${who} has not signed in yet`,
  );
}

const tracked = TRACKED.map((t) => t.email);
const others = logins.filter((l) => !tracked.includes(l.email));
if (others.length) {
  console.log("\nOTHER USERS");
  for (const l of others.sort((a, b) => b._max.createdAt - a._max.createdAt)) {
    console.log(
      `  ${l.email.padEnd(31)} ${String(l._count._all).padStart(3)} logins   last ${fmt(l._max.createdAt)}`,
    );
  }
}

console.log("\nALL ACCOUNTS (lastLoginAt)");
const users = await prisma.user.findMany({
  select: { email: true, role: true, lastLoginAt: true },
  orderBy: { lastLoginAt: "desc" },
});
for (const u of users) {
  console.log(`  ${(u.email ?? "?").padEnd(31)} ${u.role.padEnd(8)} ${fmt(u.lastLoginAt)}`);
}
console.log();
