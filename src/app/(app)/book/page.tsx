import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTeacherAvailability } from "@/lib/googleCalendar";
import SlotPicker from "@/components/SlotPicker";
import { CalendarPlus, Clock, CheckCircle2, XCircle, CalendarClock } from "lucide-react";

const TZ = "America/Sao_Paulo";

function fmt(d: Date): string {
  return d.toLocaleString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

const STATUS_STYLE: Record<
  string,
  { label: string; color: string; Icon: typeof Clock }
> = {
  pending: { label: "Pending", color: "#f59e0b", Icon: Clock },
  confirmed: { label: "Confirmed", color: "#16a34a", Icon: CheckCircle2 },
  declined: { label: "Declined", color: "#dc2626", Icon: XCircle },
};

export default async function BookPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const email = session.user.email?.toLowerCase();
  if (!email) redirect("/dashboard");

  const enrollments = await prisma.enrollment.findMany({
    where: { studentEmail: email },
    include: { teacher: true },
  });

  const myBookings = await prisma.booking.findMany({
    where: { studentEmail: email },
    orderBy: { start: "desc" },
    take: 20,
  });

  const header = (
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: "var(--accent)" }}
      >
        <CalendarPlus size={18} color="white" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-[var(--text)]">Book a Class</h1>
        <p className="text-[var(--text-faint)] text-xs">
          Pick an open slot in your teacher&apos;s calendar
        </p>
      </div>
    </div>
  );

  if (enrollments.length === 0) {
    return (
      <div className="space-y-6 fade-in">
        {header}
        <div
          className="rounded-2xl p-6 shadow-lg text-center"
          style={{ backgroundColor: "var(--navy-card)" }}
        >
          <CalendarClock
            size={28}
            className="text-indigo-400 mx-auto mb-3"
          />
          <p className="text-[var(--text)] font-medium text-sm">
            You&apos;re not linked to a teacher yet.
          </p>
          <p className="text-[var(--text-faint)] text-sm mt-1">
            Your teacher will schedule your first class to get you started. After
            that, you can book classes here.
          </p>
        </div>
      </div>
    );
  }

  const teacherAvail = await Promise.all(
    enrollments.map(async (e) => ({
      teacher: e.teacher,
      slots: (await getTeacherAvailability(e.teacherId)) ?? null,
    }))
  );

  return (
    <div className="space-y-6 fade-in">
      {header}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available slots */}
        <div className="space-y-6">
          {teacherAvail.map(({ teacher, slots }) => (
            <div
              key={teacher.id}
              className="rounded-2xl p-5 shadow-lg"
              style={{ backgroundColor: "var(--navy-card)" }}
            >
              <h2 className="text-[var(--text)] font-semibold text-sm mb-4 flex items-center gap-2">
                <CalendarClock size={14} className="text-indigo-400" />
                {teacher.name ?? "Your teacher"}
              </h2>
              {slots === null ? (
                <p className="text-red-400/80 text-sm italic">
                  Couldn&apos;t load your teacher&apos;s calendar. Please try
                  again later.
                </p>
              ) : (
                <SlotPicker teacherId={teacher.id} slots={slots} />
              )}
            </div>
          ))}
        </div>

        {/* My requests */}
        <div
          className="rounded-2xl p-5 shadow-lg"
          style={{ backgroundColor: "var(--navy-card)" }}
        >
          <h2 className="text-[var(--text)] font-semibold text-sm mb-4 flex items-center gap-2">
            <Clock size={14} className="text-indigo-400" />
            Your Requests
          </h2>
          {myBookings.length === 0 ? (
            <p className="text-[var(--text-faint)] text-sm italic">
              No requests yet. Pick a slot to request a class.
            </p>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {myBookings.map((b) => {
                const s = STATUS_STYLE[b.status] ?? STATUS_STYLE.pending;
                return (
                  <div
                    key={b.id}
                    className="rounded-xl p-3 border border-[var(--border)]"
                    style={{ backgroundColor: "var(--elev-1)" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[var(--text)] font-medium text-sm">
                          {b.summary}
                        </span>
                        <p className="text-[var(--text-faint)] text-xs mt-0.5">
                          {fmt(b.start)}
                        </p>
                      </div>
                      <span
                        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.color + "22", color: s.color }}
                      >
                        <s.Icon size={11} />
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
