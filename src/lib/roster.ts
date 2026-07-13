import { prisma } from "@/lib/prisma";

export type RosterEntry = {
  email: string;
  role: string;
  status: string;
};

/** Emails are matched case-insensitively; Google may hand back any casing. */
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => normalizeEmail(e))
    .filter(Boolean),
);

/**
 * Admin is decided by EMAIL, deliberately not by role. Two consequences that
 * are both intentional:
 *   1. The admin can set their own role to "student" to test the student view
 *      and still keep control of the roster.
 *   2. Promoting someone to teacher grants teaching rights only — it never
 *      grants the power to add or revoke people.
 */
export function isAdmin(email: string | null | undefined) {
  if (!email) return false;
  return adminEmails.has(normalizeEmail(email));
}

/**
 * The single gate. Returns the roster entry if this email is allowed to sign
 * in, or null if it is absent or revoked. Anyone not on the roster is denied.
 */
export async function lookupRoster(email: string | null | undefined) {
  if (!email) return null;
  const entry = await prisma.allowedEmail.findUnique({
    where: { email: normalizeEmail(email) },
  });
  if (!entry || entry.status !== "active") return null;
  return entry;
}
