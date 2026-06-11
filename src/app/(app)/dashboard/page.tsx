import { auth } from "@/lib/auth";
import { BookOpen, Headphones, ClipboardList, MapPin, User, Calendar } from "lucide-react";
import Link from "next/link";
import LessonsChart from "@/components/LessonsChart";
import books from "@/data/books.json";
import {
  getTeacherEvents,
  getStudentClassEvents,
  formatEventTime,
  CalendarEvent,
} from "@/lib/googleCalendar";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;
  const user = session.user;
  const role = (user as { role?: string })?.role ?? "student";

  const totalBooks = books.books.length;
  const totalListenings = books.books.reduce((acc, b) => acc + (b.listenings ?? 0), 0);
  const totalQuizes = books.books.length;

  let calendarEvents: CalendarEvent[] = [];
  if (role === "teacher") {
    calendarEvents = await getTeacherEvents(user.id);
  } else if (user.email) {
    calendarEvents = await getStudentClassEvents(user.email);
  }

  return (
    <div className="space-y-5 fade-in">
      {/* Welcome card */}
      <div className="rounded-2xl p-6 shadow-lg" style={{ backgroundColor: "var(--navy-card)" }}>
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1">
            <p className="text-white/40 text-sm mb-1">Welcome Back,</p>
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <div className="flex flex-wrap gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-sm text-white/50">
                <MapPin size={14} className="text-indigo-400" />
                Speak-Up English School
              </span>
              <span className="flex items-center gap-1.5 text-sm text-white/50">
                <User size={14} className="text-indigo-400" />
                {role === "teacher" ? "Teacher" : "Student"}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 mt-5">
              {[
                { icon: BookOpen, count: totalBooks, label: "Books", color: "#5c6bc0" },
                { icon: Headphones, count: totalListenings || 9, label: "Listenings", color: "#7986cb" },
                { icon: ClipboardList, count: totalQuizes, label: "Quiz", color: "#9575cd" },
              ].map(({ icon: Icon, count, label, color }) => (
                <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ backgroundColor: color }}>
                  <Icon size={16} color="white" />
                  <span className="text-white font-bold text-lg leading-none">{count}</span>
                  <span className="text-white/80 text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agenda */}
          <div className="md:w-72">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-indigo-400" />
              <span className="font-semibold text-white/70 text-sm">
                {role === "teacher" ? "Your Schedule" : "Your Classes"}
              </span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {calendarEvents.length === 0 ? (
                <p className="text-xs text-white/30 italic">
                  {role === "teacher" ? "No classes scheduled" : "No classes booked yet"}
                </p>
              ) : (
                calendarEvents.map((event) => (
                  <div
                    key={event.id}
                    className="text-xs text-white/60 py-1 border-l-2 pl-2"
                    style={{ borderColor: "#5c6bc0" }}
                  >
                    <span className="font-medium text-white/80">{event.summary}</span>
                    <br />
                    <span className="text-white/40">{formatEventTime(event)}</span>
                    {role === "teacher" && event.attendees && event.attendees.length > 0 && (
                      <>
                        <br />
                        <span className="text-indigo-400/70">
                          {event.attendees.map((a) => a.displayName ?? a.email).join(", ")}
                        </span>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lower row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Quick access */}
        <div className="rounded-2xl p-5 shadow-lg"
          style={{ backgroundColor: "var(--navy-card)" }}>
          <h3 className="text-white font-semibold mb-4 text-sm">Quick Access</h3>
          <div className="space-y-2">
            {[
              { label: "Books", href: "/books", icon: BookOpen, color: "#dc2626" },
              { label: "Listening", href: "/listenings", icon: Headphones, color: "#5c6bc0" },
              { label: "Quiz", href: "/quizes", icon: ClipboardList, color: "#7c3aed" },
            ].map(({ label, href, icon: Icon, color }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-90"
                style={{ backgroundColor: color + "22" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: color }}>
                  <Icon size={14} color="white" />
                </div>
                <span className="text-white text-sm font-medium">{label}</span>
                <span className="ml-auto text-white/40 text-xs">Access →</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Lessons per week chart */}
        <div className="md:col-span-2 rounded-2xl p-5 shadow-lg" style={{ backgroundColor: "var(--navy-card)" }}>
          <h3 className="text-white/70 font-semibold mb-4 text-sm">Lessons per week</h3>
          <LessonsChart />
        </div>
      </div>
    </div>
  );
}
