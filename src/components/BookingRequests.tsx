"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Clock } from "lucide-react";

const TZ = "America/Sao_Paulo";

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

type Req = {
  id: string;
  studentEmail: string;
  studentName: string | null;
  startISO: string;
};

export default function BookingRequests({ requests }: { requests: Req[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, action: "accept" | "decline") {
    setError(null);
    setBusy(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Action failed.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (requests.length === 0) {
    return (
      <p className="text-[var(--text-faint)] text-sm italic">
        No pending requests.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {requests.map((r) => (
        <div
          key={r.id}
          className="rounded-xl p-3 border border-[var(--border)]"
          style={{ backgroundColor: "var(--elev-1)" }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[var(--text)] font-medium text-sm">
                {r.studentName ?? r.studentEmail}
              </p>
              <p className="text-[var(--text-faint)] text-xs mt-0.5 flex items-center gap-1">
                <Clock size={11} className="text-indigo-400" />
                {fmt(r.startISO)}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => act(r.id, "accept")}
                disabled={busy !== null}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#16a34a" }}
                aria-label="Accept"
              >
                {busy === r.id ? (
                  <Loader2 size={14} className="animate-spin" color="white" />
                ) : (
                  <Check size={14} color="white" />
                )}
              </button>
              <button
                onClick={() => act(r.id, "decline")}
                disabled={busy !== null}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#dc2626" }}
                aria-label="Decline"
              >
                <X size={14} color="white" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
