"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, isAdmin } from "@/lib/roster";
import { revalidatePath } from "next/cache";

/**
 * Every action re-checks admin server-side. The page already hides itself from
 * non-admins, but a hidden form is not access control — a teacher could still
 * POST to these actions directly. Admin is by email, so a teacher never passes.
 */
async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email;
  if (!session?.user?.id || !isAdmin(email)) {
    throw new Error("Forbidden: admin only");
  }
  return session;
}

export async function addEmail(formData: FormData) {
  await requireAdmin();

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const role = String(formData.get("role") ?? "student");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!email || !email.includes("@")) return;
  if (role !== "student" && role !== "teacher") return;

  // Re-adding a previously revoked email restores access rather than erroring.
  await prisma.allowedEmail.upsert({
    where: { email },
    create: { email, role, status: "active", note },
    update: { role, status: "active", note },
  });

  revalidatePath("/admin/access");
}

export async function setRole(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id"));
  const role = String(formData.get("role"));
  if (role !== "student" && role !== "teacher") return;

  const entry = await prisma.allowedEmail.findUnique({ where: { id } });
  if (!entry) return;

  // The admin IS allowed to change their own role here — that's how they switch
  // between the teacher and student views while building. Admin rights come
  // from the email, so this can't lock them out of this page.
  await prisma.allowedEmail.update({ where: { id }, data: { role } });
  await prisma.user.updateMany({ where: { email: entry.email }, data: { role } });

  // Force a fresh sign-in so the new role is picked up by /api/set-role.
  const user = await prisma.user.findUnique({ where: { email: entry.email } });
  if (user) await prisma.session.deleteMany({ where: { userId: user.id } });

  revalidatePath("/admin/access");
}

export async function setStatus(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (status !== "active" && status !== "revoked") return;

  const entry = await prisma.allowedEmail.findUnique({ where: { id } });
  if (!entry) return;

  // The admin account can never be revoked — not by anyone, not by accident.
  if (isAdmin(entry.email)) return;

  await prisma.allowedEmail.update({ where: { id }, data: { status } });

  // Revoking must bite now, not in 30 days when the session cookie expires.
  if (status === "revoked") {
    const user = await prisma.user.findUnique({ where: { email: entry.email } });
    if (user) await prisma.session.deleteMany({ where: { userId: user.id } });
  }

  revalidatePath("/admin/access");
}
