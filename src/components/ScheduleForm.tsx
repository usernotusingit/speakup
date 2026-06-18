"use client";

import { useState } from "react";
import { Plus, X, CalendarPlus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ScheduleForm() {
  const router = useRouter();
  const [summary, setSummary] = useState("English Class");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function addAttendee() {
    const email = emailInput.trim().toLowerCase();
    if (!email || attendees.includes(email)) return;
    setAttendees((prev) => [...prev, email]);
    setEmailInput("");
  }

  function removeAttendee(email: string) {
    setAttendees((prev) => prev.filter((e) => e !== email));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!date || !startTime || !endTime || attendees.length === 0) {
      setError("Please fill all fields and add at least one student.");
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}`).toISOString();

    if (new Date(endDateTime) <= new Date(startDateTime)) {
      setError("End time must be after start time.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, startDateTime, endDateTime, attendeeEmails: attendees }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setSuccess(true);
      setSummary("English Class");
      setDate("");
      setStartTime("");
      setEndTime("");
      setAttendees([]);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-1 focus:ring-indigo-500 transition";
  const inputStyle = {
    backgroundColor: "var(--elev-1)",
    border: "1px solid var(--border)",
  };

  return (
    <div className="rounded-2xl p-5 shadow-lg" style={{ backgroundColor: "var(--navy-card)" }}>
      <h2 className="text-[var(--text)] font-semibold text-sm mb-4 flex items-center gap-2">
        <CalendarPlus size={14} className="text-indigo-400" />
        New Class
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-[var(--text-faint)] text-xs mb-1 block">Title</label>
          <input
            className={inputClass}
            style={inputStyle}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="English Class"
            required
          />
        </div>

        <div>
          <label className="text-[var(--text-faint)] text-xs mb-1 block">Date</label>
          <input
            type="date"
            className={inputClass}
            style={{ ...inputStyle, colorScheme: "dark" }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[var(--text-faint)] text-xs mb-1 block">Start</label>
            <input
              type="time"
              className={inputClass}
              style={{ ...inputStyle, colorScheme: "dark" }}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[var(--text-faint)] text-xs mb-1 block">End</label>
            <input
              type="time"
              className={inputClass}
              style={{ ...inputStyle, colorScheme: "dark" }}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-[var(--text-faint)] text-xs mb-1 block">Students</label>
          <div className="flex gap-2">
            <input
              className={inputClass}
              style={inputStyle}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAttendee(); } }}
              placeholder="student@email.com"
              type="email"
            />
            <button
              type="button"
              onClick={addAttendee}
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition hover:opacity-80"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <Plus size={16} color="white" />
            </button>
          </div>

          {attendees.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {attendees.map((email) => (
                <span
                  key={email}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: "#5c6bc022", color: "#818cf8" }}
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeAttendee(email)}
                    className="hover:text-[var(--text)] transition"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}
        {success && <p className="text-green-400 text-xs">Class created — invite sent to students.</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {loading ? "Creating…" : "Create Class"}
        </button>
      </form>
    </div>
  );
}
