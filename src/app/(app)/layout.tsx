import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { recordVisit } from "@/lib/access";
import { lookupRoster, isAdmin } from "@/lib/roster";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  // Revocation has to bite immediately. A session cookie stays valid for 30
  // days, so without this check a revoked user would keep full access until it
  // expired. Re-checking the roster on every gated page closes that window.
  const entry = await lookupRoster(session.user.email);
  if (!entry) {
    await prisma.session.deleteMany({ where: { userId: session.user.id } });
    redirect("/login?revoked=1");
  }

  // Every gated page passes through here, including sessions resumed from an
  // existing cookie that never hit the sign-in flow.
  await recordVisit(session.user.id, session.user.email ?? "unknown");

  const role = entry.role;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--navy)" }}>
      <Navbar role={role} isAdmin={isAdmin(session.user.email)} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
