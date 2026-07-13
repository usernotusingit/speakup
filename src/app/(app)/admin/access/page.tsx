import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addEmail, setRole, setStatus } from "./actions";
import { isAdmin } from "@/lib/roster";
import { ShieldCheck, UserPlus, Ban, RotateCcw } from "lucide-react";

export const dynamic = "force-dynamic";

function ago(d: Date | null) {
  if (!d) return "never";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default async function AccessAdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  // Admin is by email, not role — a teacher must never reach this page.
  if (!isAdmin(session.user.email)) redirect("/dashboard");

  const [roster, users, denied] = await Promise.all([
    prisma.allowedEmail.findMany({ orderBy: [{ role: "asc" }, { email: "asc" }] }),
    prisma.user.findMany({ select: { email: true, lastSeenAt: true } }),
    prisma.accessLog.findMany({
      where: { event: "denied" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const seen = new Map(users.map((u) => [u.email, u.lastSeenAt]));

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <ShieldCheck className="text-amber-400" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-white">Access control</h1>
          <p className="text-sm text-slate-400">
            Only emails on this list can sign in. Everyone else is refused.
            You are the only admin — teachers cannot change this list.
          </p>
        </div>
      </header>

      <section className="bg-white/5 rounded-xl p-5 border border-white/10">
        <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <UserPlus size={16} /> Add an email
        </h2>
        <form action={addEmail} className="flex flex-wrap gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="student@gmail.com"
            className="flex-1 min-w-56 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
          <select
            name="role"
            defaultValue="student"
            className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white"
          >
            <option value="student">student</option>
            <option value="teacher">teacher</option>
          </select>
          <input
            name="note"
            placeholder="note (optional)"
            className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-300"
          >
            Add
          </button>
        </form>
      </section>

      <section className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-white/10">
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Role</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Last seen</th>
              <th className="py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r) => {
              const isProtected = isAdmin(r.email);
              return (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="py-3 pr-4 text-white">
                    {r.email}
                    {isProtected && (
                      <span className="ml-2 rounded bg-amber-400/15 px-1.5 py-0.5 text-xs text-amber-300">
                        admin
                      </span>
                    )}
                    {r.note && <div className="text-xs text-slate-500">{r.note}</div>}
                  </td>
                  <td className="py-3 pr-4">
                    <form action={setRole} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={r.id} />
                      <select
                        name="role"
                        defaultValue={r.role}
                        className="rounded bg-black/30 border border-white/10 px-2 py-1 text-xs text-white"
                      >
                        <option value="student">student</option>
                        <option value="teacher">teacher</option>
                      </select>
                      <button type="submit" className="text-xs text-amber-400 hover:underline">
                        save
                      </button>
                    </form>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={
                        r.status === "active"
                          ? "rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-300"
                          : "rounded-full bg-rose-400/15 px-2 py-0.5 text-xs text-rose-300"
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-400">{ago(seen.get(r.email) ?? null)}</td>
                  <td className="py-3">
                    {isProtected ? (
                      <span className="text-xs text-slate-600">cannot be revoked</span>
                    ) : (
                      <form action={setStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={r.status === "active" ? "revoked" : "active"}
                        />
                        <button
                          type="submit"
                          className="flex items-center gap-1 text-xs text-slate-300 hover:text-white"
                        >
                          {r.status === "active" ? (
                            <>
                              <Ban size={13} /> Revoke
                            </>
                          ) : (
                            <>
                              <RotateCcw size={13} /> Restore
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-300 mb-2">
          Refused sign-in attempts
        </h2>
        {denied.length === 0 ? (
          <p className="text-sm text-slate-500">None. Nobody off-roster has tried to sign in.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {denied.map((d) => (
              <li key={d.id} className="text-slate-400">
                <span className="text-rose-300">{d.email}</span> — refused{" "}
                {ago(d.createdAt)} {d.ip && <span className="text-slate-600">from {d.ip}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
