import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { recordVisit } from "@/lib/access";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  // Every gated page passes through here, including sessions resumed from an
  // existing cookie that never hit the sign-in flow.
  await recordVisit(session.user.id, session.user.email ?? "unknown");

  const role = (session.user as { role?: string })?.role;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--navy)" }}>
      <Navbar role={role} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
