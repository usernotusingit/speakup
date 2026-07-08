"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, MapPin, Clock } from "lucide-react";

export type CheckpointRow = { prep: string; scope: string; example: string };
export type CheckpointDimension = { label: string; pt: string; rows: CheckpointRow[] };
export type ConjugationColumn = { key: string; label: string };
export type ConjugationRow = { subject: string; [key: string]: string };
export type Checkpoint = {
  type?: "rule" | "conjugation";
  label: string;
  tagline: string;
  intro: string;
  // rule layout (e.g. Lesson 3 — Preposition Rule)
  words?: { word: string; size: string; hint: string }[];
  dimensions?: CheckpointDimension[];
  // conjugation layout (e.g. Lesson 11 — verb TO BE)
  columns?: ConjugationColumn[];
  rows?: ConjugationRow[];
  note?: string;
};

// One color per preposition, matching the book's IN (pink) / ON (blue) / AT (green).
const PREP_STYLE: Record<string, { text: string; bg: string; ring: string }> = {
  in: { text: "text-pink-600", bg: "bg-pink-50", ring: "ring-pink-200" },
  on: { text: "text-sky-500", bg: "bg-sky-50", ring: "ring-sky-200" },
  at: { text: "text-emerald-500", bg: "bg-emerald-50", ring: "ring-emerald-200" },
};

function prepStyle(word: string) {
  return PREP_STYLE[word.toLowerCase()] ?? { text: "text-gray-700", bg: "bg-gray-50", ring: "ring-gray-200" };
}

// One color per verb form for the conjugation table.
const FORM_STYLE: Record<string, { text: string; bg: string; head: string }> = {
  affirmative: { text: "text-emerald-700", bg: "bg-emerald-50", head: "bg-emerald-500" },
  negative: { text: "text-rose-700", bg: "bg-rose-50", head: "bg-rose-500" },
  contracted: { text: "text-violet-700", bg: "bg-violet-50", head: "bg-violet-500" },
  interrogative: { text: "text-sky-700", bg: "bg-sky-50", head: "bg-sky-500" },
};

function formStyle(key: string) {
  return FORM_STYLE[key] ?? { text: "text-gray-700", bg: "bg-gray-50", head: "bg-gray-500" };
}

// Emphasize the preposition inside an example sentence.
function Example({ prep, text }: { prep: string; text: string }) {
  const style = prepStyle(prep);
  const re = new RegExp(`\\b(${prep})\\b`, "i");
  const parts = text.split(re);
  return (
    <span className="text-sm text-gray-700">
      {parts.map((p, i) =>
        re.test(p) ? (
          <span key={i} className={`font-bold ${style.text}`}>
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </span>
  );
}

// ─── Rule layout (Preposition Rule) ──────────────────────────────────────────
function RuleView({ checkpoint }: { checkpoint: Checkpoint }) {
  return (
    <>
      {checkpoint.words && (
        <div className="grid grid-cols-3 gap-3">
          {checkpoint.words.map((w) => {
            const s = prepStyle(w.word);
            return (
              <div key={w.word} className={`rounded-2xl ${s.bg} ring-1 ${s.ring} px-3 py-4 text-center`}>
                <div className={`text-3xl font-black lowercase ${s.text}`}>{w.word}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-1">{w.size}</div>
                <div className="text-[11px] text-gray-500 mt-1 leading-tight">{w.hint}</div>
              </div>
            );
          })}
        </div>
      )}
      {checkpoint.dimensions?.map((dim) => (
        <div key={dim.label}>
          <div className="flex items-center gap-2 mb-2">
            {dim.label === "PLACE" ? (
              <MapPin size={15} className="text-violet-500" />
            ) : (
              <Clock size={15} className="text-violet-500" />
            )}
            <span className="text-sm font-bold text-gray-700">{dim.label}</span>
            <span className="text-xs text-gray-400">· {dim.pt}</span>
          </div>
          <div className="space-y-1.5">
            {dim.rows.map((r, i) => {
              const s = prepStyle(r.prep);
              return (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                  <span className={`w-11 shrink-0 text-center font-black lowercase ${s.text}`}>{r.prep}</span>
                  <span className="w-32 shrink-0 text-xs text-gray-500 leading-tight">{r.scope}</span>
                  <Example prep={r.prep} text={r.example} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Conjugation layout (verb TO BE) ─────────────────────────────────────────
function ConjugationView({ checkpoint }: { checkpoint: Checkpoint }) {
  const columns = checkpoint.columns ?? [];
  const rows = checkpoint.rows ?? [];
  return (
    <>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="text-left"></th>
              {columns.map((c) => (
                <th key={c.key} className="p-0">
                  <div
                    className={`${formStyle(c.key).head} text-white text-[11px] font-bold uppercase tracking-wide rounded-lg px-2 py-1.5 text-center whitespace-nowrap`}
                  >
                    {c.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.subject}>
                <td className="pr-2 font-bold text-gray-700 whitespace-nowrap text-right align-middle">
                  {r.subject}
                </td>
                {columns.map((c) => {
                  const s = formStyle(c.key);
                  return (
                    <td key={c.key} className={`${s.bg} ${s.text} rounded-lg px-2.5 py-2 font-semibold whitespace-nowrap text-center align-middle`}>
                      {r[c.key]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {checkpoint.note && (
        <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50 ring-1 ring-amber-200">
          <span className="text-amber-500 font-black shrink-0">!</span>
          <p className="text-sm text-amber-800 leading-snug">{checkpoint.note}</p>
        </div>
      )}
    </>
  );
}

export default function CheckpointSpotlight({ checkpoint }: { checkpoint: Checkpoint }) {
  const [open, setOpen] = useState(false);

  // Lock body scroll + close on Escape while the modal is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Spotlight trigger — deliberately not a plain accordion row */}
      <button
        onClick={() => setOpen(true)}
        className="group w-full flex items-center gap-4 px-5 py-4 text-left rounded-2xl
                   bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white
                   shadow-lg shadow-violet-500/25 hover:shadow-xl hover:-translate-y-0.5
                   transition-all duration-200"
      >
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Checkpoint</span>
          </div>
          <div className="font-bold text-base leading-tight">{checkpoint.label}</div>
          <div className="text-sm text-white/80 truncate">{checkpoint.tagline}</div>
        </div>
        <span className="shrink-0 text-xs font-semibold bg-white/20 rounded-full px-3 py-1.5 group-hover:bg-white/30 transition-colors">
          Open
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white px-6 pt-6 pb-5">
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/80">
                <Sparkles size={13} /> Checkpoint
              </div>
              <h3 className="text-2xl font-extrabold mt-1">{checkpoint.label}</h3>
              <p className="text-sm text-white/85 mt-2 leading-relaxed">{checkpoint.intro}</p>
            </div>

            <div className="px-6 py-6 space-y-6">
              {checkpoint.type === "conjugation" ? (
                <ConjugationView checkpoint={checkpoint} />
              ) : (
                <RuleView checkpoint={checkpoint} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
