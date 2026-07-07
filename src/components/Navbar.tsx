"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Home, BookOpen, Headphones, ClipboardList, LogOut, CalendarDays } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const baseLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/books", label: "Books", icon: BookOpen },
  { href: "/listenings", label: "Listening", icon: Headphones },
  { href: "/quizes", label: "Quiz", icon: ClipboardList },
];

const teacherLinks = [
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
];

export default function Navbar({ role }: { role?: string }) {
  const pathname = usePathname();
  const links = role === "teacher" ? [...baseLinks, ...teacherLinks] : baseLinks;

  return (
    <nav className="sticky top-0 z-50 shadow-lg"
      style={{ backgroundColor: "var(--navy-card)", borderBottom: "1px solid var(--border)" }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center mr-4 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Speak-Up English" className="h-8 w-auto" />
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 flex-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: active ? "var(--accent)" : "transparent",
                  color: active ? "white" : "var(--text-muted)",
                }}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Theme toggle + Logout */}
        <ThemeToggle />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut size={15} />
          <span className="hidden sm:inline text-xs">Logout</span>
        </button>
      </div>
    </nav>
  );
}
