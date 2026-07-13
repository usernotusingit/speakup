import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

// Accounts called out by name. Testers are invited via the Google OAuth
// consent screen (see testers.md).
const TRACKED = [
  { email: "luizeopmartins@gmail.com", label: "tester" },
  { email: "analaura.alfo30@gmail.com", label: "tester" },
  { email: "csopenclawmaxp@gmail.com", label: "own test student acct" },
];

const days = Number(process.argv[2] ?? 10);
const since = new Date(Date.now() - days * 864e5);

const url = `file:${path.resolve(process.cwd(), process.env.DATABASE_URL.slice(5))}`;
const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url }), log: ["error"] });

const fmt = (d) => (d ? d.toISOString().slice(0, 16).replace("T", " ") : "never");
const device = (ua) =>
  !ua ? "?"
  : /iPhone/.test(ua) ? "iPhone"
  : /iPad/.test(ua) ? "iPad"
  : /Android/.test(ua) ? "Android"
  : /Macintosh/.test(ua) ? "Mac"
  : /Windows/.test(ua) ? "Windows"
  : /Linux/.test(ua) ? "Linux"
  : "other";

const events = await prisma.accessLog.findMany({
  where: { createdAt: { gte: since } },
  orderBy: { createdAt: "asc" },
});

const stats = new Map();
for (const e of events) {
  const s = stats.get(e.email) ?? { logins: 0, visits: 0, first: null, last: null, ips: new Set(), devices: new Set() };
  if (e.event === "login") s.logins++;
  else s.visits++;
  s.first ??= e.createdAt;
  s.last = e.createdAt;
  if (e.ip) s.ips.add(e.ip);
  s.devices.add(device(e.userAgent));
  stats.set(e.email, s);
}

const line = (email, label, s) => {
  const who = label ? `${email} (${label})` : email;
  if (!s) return `  ⏳ ${who.padEnd(48)} no access recorded`;
  return (
    `  ✅ ${who.padEnd(48)} ${String(s.logins).padStart(3)} logins  ${String(s.visits).padStart(3)} visits\n` +
    `       first ${fmt(s.first)}   last ${fmt(s.last)}\n` +
    `       devices: ${[...s.devices].join(", ")}   IPs: ${[...s.ips].join(", ") || "—"}`
  );
};

console.log(`\nSPEAKUP ACCESS — last ${days} days (since ${fmt(since)} UTC)`);
console.log("=".repeat(72));
console.log("\nTRACKED ACCOUNTS");
for (const { email, label } of TRACKED) console.log(line(email, label, stats.get(email)));

const trackedEmails = TRACKED.map((t) => t.email);
const others = [...stats.keys()].filter((e) => !trackedEmails.includes(e));
if (others.length) {
  console.log("\nOTHER ACCOUNTS");
  for (const email of others) console.log(line(email, null, stats.get(email)));
}

console.log("\nALL ACCOUNTS — last seen");
const users = await prisma.user.findMany({
  select: { email: true, role: true, lastLoginAt: true, lastSeenAt: true },
  orderBy: { lastSeenAt: { sort: "desc", nulls: "last" } },
});
console.log(`  ${"EMAIL".padEnd(28)} ${"ROLE".padEnd(8)} ${"LAST LOGIN".padEnd(18)} LAST SEEN`);
for (const u of users) {
  console.log(
    `  ${(u.email ?? "?").padEnd(28)} ${u.role.padEnd(8)} ${fmt(u.lastLoginAt).padEnd(18)} ${fmt(u.lastSeenAt)}`,
  );
}

console.log(`\n(login = fresh sign-in; visit = session resumed after >30min idle)`);
console.log(`(tracking began 2026-07-13; nothing before that was recorded)\n`);
