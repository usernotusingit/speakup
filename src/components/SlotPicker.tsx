"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

type Slot = { startISO: string; endISO: string };

const TZ = "America/Sao_Paulo";

// Stable per-day key (YYYY-MM-DD in the school's timezone) for grouping.
function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
}
function weekday(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("pt-BR", { weekday: "short", timeZone: TZ })
    .replace(".", "");
}
function dayNum(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", timeZone: TZ });
}
function month(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("pt-BR", { month: "short", timeZone: TZ })
    .replace(".", "");
}
function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

type Day = { key: string; iso: string; slots: Slot[] };

export default function SlotPicker({
  teacherId,
  slots,
}: {
  teacherId: string;
  slots: Slot[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Group slots into days, preserving order.
  const days: Day[] = [];
  const idx = new Map<string, number>();
  for (const s of slots) {
    const key = dayKey(s.startISO);
    if (!idx.has(key)) {
      idx.set(key, days.length);
      days.push({ key, iso: s.startISO, slots: [] });
    }
    days[idx.get(key)!].slots.push(s);
  }

  const [selected, setSelected] = useState<string | null>(days[0]?.key ?? null);
  const current = days.find((d) => d.key === selected) ?? days[0];

  async function book(slot: Slot) {
    setError(null);
    setPending(slot.startISO);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          startISO: slot.startISO,
          endISO: slot.endISO,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't request this slot.");
        return;
      }
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  if (slots.length === 0 || !current) {
    return (
      <p className="text-[var(--text-faint)] text-sm italic">
        No open slots in the next two weeks. Check back soon.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Step 1 — pick a day */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {days.map((d) => {
          const active = d.key === current.key;
          return (
            <button
              key={d.key}
              onClick={() => setSelected(d.key)}
              className="shrink-0 flex flex-col items-center w-14 py-2 rounded-xl transition"
              style={{
                backgroundColor: active ? "var(--accent)" : "var(--elev-1)",
                border: "1px solid var(--border)",
                color: active ? "white" : "var(--text-muted)",
              }}
            >
              <span className="text-[10px] uppercase tracking-wide capitalize">
                {weekday(d.iso)}
              </span>
              <span className="text-lg font-bold leading-tight">{dayNum(d.iso)}</span>
              <span className="text-[10px] capitalize opacity-80">{month(d.iso)}</span>
            </button>
          );
        })}
      </div>

      {/* Step 2 — pick a time on that day */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {current.slots.map((s) => (
          <button
            key={s.startISO}
            onClick={() => book(s)}
            disabled={pending !== null}
            className="flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: "var(--elev-1)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            {pending === s.startISO && <Loader2 size={12} className="animate-spin" />}
            {timeLabel(s.startISO)}
          </button>
        ))}
      </div>

      <p className="text-[var(--text-faint)] text-xs">
        Pick a time to request it — your teacher confirms the class.
      </p>
    </div>
  );
}
