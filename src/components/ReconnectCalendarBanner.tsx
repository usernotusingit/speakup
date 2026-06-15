"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Shown to a teacher whose Google account is missing the Calendar scope (or whose
 * calendar couldn't be created). Re-running the Google sign-in with consent
 * re-grants the scope; the /api/set-role callback then (re)creates the calendar.
 */
export default function ReconnectCalendarBanner({
  next = "/schedule",
}: {
  next?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleReconnect() {
    setLoading(true);
    await signIn("google", { callbackUrl: `/api/set-role?next=${encodeURIComponent(next)}` });
  }

  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-3 border"
      style={{
        backgroundColor: "rgba(234,179,8,0.08)",
        borderColor: "rgba(234,179,8,0.25)",
      }}
    >
      <AlertTriangle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-white text-sm font-semibold">Google Calendar not connected</p>
        <p className="text-white/50 text-xs mt-0.5">
          Reconnect your Google account to grant calendar access so your Speak-Up
          classes can be created and shown here.
        </p>
      </div>
      <button
        onClick={handleReconnect}
        disabled={loading}
        className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "var(--accent)" }}
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        {loading ? "Connecting…" : "Reconnect"}
      </button>
    </div>
  );
}
