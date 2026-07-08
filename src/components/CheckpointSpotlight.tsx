"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, MapPin, Clock } from "lucide-react";

export type CheckpointRow = { prep: string; scope: string; example: string };
export type CheckpointDimension = { label: string; pt: string; rows: CheckpointRow[] };
export type Checkpoint = {
  label: string;
  tagline: string;
  intro: string;
  words: { word: string; size: string; hint: string }[];
  dimensions: CheckpointDimension[];
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
              {/* The three words, big and bold */}
              <div className="grid grid-cols-3 gap-3">
                {checkpoint.words.map((w) => {
                  const s = prepStyle(w.word);
                  return (
                    <div
                      key={w.word}
                      className={`rounded-2xl ${s.bg} ring-1 ${s.ring} px-3 py-4 text-center`}
                    >
                      <div className={`text-3xl font-black lowercase ${s.text}`}>{w.word}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-1">
                        {w.size}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 leading-tight">{w.hint}</div>
                    </div>
                  );
                })}
              </div>

              {/* Place / Time tables */}
              {checkpoint.dimensions.map((dim) => (
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
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50"
                        >
                          <span
                            className={`w-11 shrink-0 text-center font-black lowercase ${s.text}`}
                          >
                            {r.prep}
                          </span>
                          <span className="w-32 shrink-0 text-xs text-gray-500 leading-tight">
                            {r.scope}
                          </span>
                          <Example prep={r.prep} text={r.example} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
