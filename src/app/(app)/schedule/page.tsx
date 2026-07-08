import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTeacherEvents, formatEventTime } from "@/lib/googleCalendar";
import { Calendar, Users, Clock, Inbox } from "lucide-react";
import ScheduleForm from "@/components/ScheduleForm";
import BookingRequests from "@/components/BookingRequests";
import ReconnectCalendarBanner from "@/components/ReconnectCalendarBanner";

export default async function SchedulePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role?: string })?.role;
  if (role !== "teacher") redirect("/dashboard");

  const result = await getTeacherEvents(session.user.id);
  const events = result.status === "ok" ? result.events : [];
  const showReconnect =
    result.status === "scope_missing" || result.status === "no_calendar";
  const loadError = result.status === "error";

  const pendingRequests = await prisma.booking.findMany({
    where: { teacherId: session.user.id, status: "pending" },
    orderBy: { start: "asc" },
  });
  const requests = pendingRequests.map((b) => ({
    id: b.id,
    studentEmail: b.studentEmail,
    studentName: b.studentName,
    startISO: b.start.toISOString(),
  }));

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--accent)" }}>
          <Calendar size={18} color="white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Schedule</h1>
          <p className="text-[var(--text-faint)] text-xs">Manage your Speak-Up classes</p>
        </div>
      </div>

      {showReconnect && <ReconnectCalendarBanner next="/schedule" />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming classes */}
        <div className="rounded-2xl p-5 shadow-lg" style={{ backgroundColor: "var(--navy-card)" }}>
          <h2 className="text-[var(--text)] font-semibold text-sm mb-4 flex items-center gap-2">
            <Clock size={14} className="text-indigo-400" />
            Upcoming Classes
          </h2>

          {loadError ? (
            <p className="text-red-400/80 text-sm italic">
              Couldn&apos;t load your calendar. Please try again later.
            </p>
          ) : events.length === 0 ? (
            <p className="text-[var(--text-faint)] text-sm italic">No classes scheduled yet.</p>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="rounded-xl p-3 border border-[var(--border)]"
                  style={{ backgroundColor: "var(--elev-1)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[var(--text)] font-medium text-sm">{event.summary}</span>
                  </div>
                  <p className="text-[var(--text-faint)] text-xs mt-0.5">{formatEventTime(event)}</p>
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <Users size={11} className="text-indigo-400 shrink-0" />
                      {event.attendees.map((a) => (
                        <span
                          key={a.email}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#5c6bc022", color: "#818cf8" }}
                        >
                          {a.displayName ?? a.email}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: booking requests + new class form */}
        <div className="space-y-6">
          <div className="rounded-2xl p-5 shadow-lg" style={{ backgroundColor: "var(--navy-card)" }}>
            <h2 className="text-[var(--text)] font-semibold text-sm mb-4 flex items-center gap-2">
              <Inbox size={14} className="text-indigo-400" />
              Booking Requests
              {requests.length > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#f59e0b22", color: "#f59e0b" }}
                >
                  {requests.length}
                </span>
              )}
            </h2>
            <BookingRequests requests={requests} />
          </div>

          <ScheduleForm />
        </div>
      </div>
    </div>
  );
}
