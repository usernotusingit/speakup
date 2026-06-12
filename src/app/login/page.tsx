"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { BookOpen, Headphones, Calendar, Lightbulb, MessageCircle, Trophy } from "lucide-react";

const bgIcons = [
  { icon: BookOpen, top: "8%", left: "6%", size: 32, opacity: 0.15 },
  { icon: Headphones, top: "12%", right: "8%", size: 36, opacity: 0.12 },
  { icon: Calendar, top: "22%", right: "4%", size: 28, opacity: 0.15 },
  { icon: MessageCircle, bottom: "30%", left: "4%", size: 30, opacity: 0.12 },
  { icon: Lightbulb, bottom: "20%", left: "10%", size: 26, opacity: 0.15 },
  { icon: Trophy, bottom: "12%", right: "10%", size: 32, opacity: 0.12 },
  { icon: BookOpen, bottom: "8%", left: "22%", size: 28, opacity: 0.1 },
];

export default function LoginPage() {
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    await signIn("google", { callbackUrl: `/api/set-role?next=/dashboard` });
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "var(--navy)" }}>

      {bgIcons.map(({ icon: Icon, size, opacity, ...pos }, i) => (
        <div key={i} className="absolute pointer-events-none" style={{ ...pos }}>
          <Icon size={size} style={{ opacity }} color="white" />
        </div>
      ))}

      <div className="relative z-10 w-full max-w-sm mx-4 fade-in">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--accent)" }}>
                <MessageCircle size={20} color="white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "var(--accent)" }}>Speak-Up</p>
                <p className="text-sm font-bold text-gray-800 -mt-0.5">English School</p>
              </div>
            </div>
          </div>

          {/* Role selector */}
          <div className="px-8 pb-4">
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              {(["teacher", "student"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className="flex-1 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: role === r ? "var(--accent)" : "transparent",
                    color: role === r ? "white" : "#6b7280",
                  }}
                >
                  {r === "teacher" ? "🎓 Teacher" : "🧑‍🎓 Student"}
                </button>
              ))}
            </div>
          </div>

          {/* Login form */}
          <div className="px-8 pb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h2>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all font-medium text-gray-700 shadow-sm disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {loading ? "Connecting…" : "Continue with Google"}
            </button>

            <p className="text-center text-xs text-gray-400 mt-6">
              Signing in as{" "}
              <span className="font-semibold" style={{ color: "var(--accent)" }}>
                {role}
              </span>
            </p>
          </div>

          <div className="border-t border-gray-100 px-8 py-3 text-center">
            <p className="text-xs text-gray-400">V1.0 · Speak-Up English</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
