"use client";

import { useState } from "react";
import {
  Layers, List, Edit3, HelpCircle, Shuffle, AlignLeft,
  Trophy, CheckCircle, XCircle,
} from "lucide-react";
import type { Challenge } from "@/lib/quizGenerator";
import FlipCards     from "@/components/quiz/FlipCards";
import MultipleChoice from "@/components/quiz/MultipleChoice";
import FillBlank     from "@/components/quiz/FillBlank";
import TrueFalse     from "@/components/quiz/TrueFalse";
import Matching      from "@/components/quiz/Matching";
import WordOrder     from "@/components/quiz/WordOrder";

// ─── Meta ────────────────────────────────────────────────────────────────────

const TYPE_META = {
  "flipcards":        { label: "Flip Cards",        Icon: Layers,     color: "text-indigo-400",  dot: "bg-indigo-400"  },
  "multiple-choice":  { label: "Multiple Choice",   Icon: List,       color: "text-sky-400",     dot: "bg-sky-400"     },
  "fill-blank":       { label: "Fill the Blank",    Icon: Edit3,      color: "text-amber-400",   dot: "bg-amber-400"   },
  "true-false":       { label: "True or False",     Icon: HelpCircle, color: "text-purple-400",  dot: "bg-purple-400"  },
  "matching":         { label: "Matching",           Icon: Shuffle,    color: "text-emerald-400", dot: "bg-emerald-400" },
  "word-order":       { label: "Word Order",         Icon: AlignLeft,  color: "text-rose-400",    dot: "bg-rose-400"    },
} satisfies Record<Challenge["type"], { label: string; Icon: React.ElementType; color: string; dot: string }>;

function briefLabel(c: Challenge): string {
  switch (c.type) {
    case "flipcards":        return c.label;
    case "multiple-choice":  { const m = c.question.match(/"([^"]+)"/); return m ? `"${m[1]}"` : c.question.slice(0, 32); }
    case "fill-blank":       return `${c.before}___ ${c.after}`.trim().slice(0, 32);
    case "true-false":       return c.sentence.slice(0, 32) + (c.sentence.length > 32 ? "…" : "");
    case "matching":         return `Match ${c.pairs.length} pairs`;
    case "word-order":       return c.hint.slice(0, 32) + (c.hint.length > 32 ? "…" : "");
  }
}

function reviewLabel(c: Challenge): string {
  switch (c.type) {
    case "flipcards":       return `${c.label} cards`;
    case "multiple-choice": return c.question.length > 60 ? c.question.slice(0, 60) + "…" : c.question;
    case "fill-blank":      return `${c.before}___ ${c.after}`.trim();
    case "true-false":      return c.sentence.length > 60 ? c.sentence.slice(0, 60) + "…" : c.sentence;
    case "matching":        return `Match ${c.pairs.length} pairs`;
    case "word-order":      return `Order: ${c.hint}`;
  }
}

function perfMsg(score: number, total: number): string {
  if (total === 0) return "All done!";
  const p = score / total;
  if (p === 1)   return "Perfect score!";
  if (p >= 0.8)  return "Great job!";
  if (p >= 0.6)  return "Good effort!";
  return "Keep practising!";
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

type Result = { correct: boolean | null };

function Sidebar({
  challenges, idx, results, onJump,
}: {
  challenges: Challenge[]; idx: number; results: Result[]; onJump: (i: number) => void;
}) {
  const current  = challenges[idx];
  const meta     = TYPE_META[current.type];

  // Build legend counts
  const counts: Partial<Record<Challenge["type"], number>> = {};
  challenges.forEach(c => { counts[c.type] = (counts[c.type] ?? 0) + 1; });

  return (
    <aside className="hidden lg:flex flex-col gap-3 w-48 shrink-0">

      {/* Dot grid */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--navy-card)" }}>
        <p className="text-[var(--text-faint)] text-xs font-semibold uppercase tracking-widest mb-3">
          {challenges.length} challenges
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {challenges.map((c, i) => {
            const m   = TYPE_META[c.type];
            const res = results[i];
            const isCurrent   = i === idx;
            const isCompleted = res !== undefined;

            let cls = "";
            if (isCurrent) {
              cls = `${m.dot} ring-2 ring-white/50 ring-offset-2 ring-offset-[#141e30]`;
            } else if (isCompleted) {
              if (res.correct === null) cls = `${m.dot} opacity-50`;
              else if (res.correct)     cls = "bg-emerald-400";
              else                      cls = "bg-rose-400";
            } else {
              cls = "bg-[var(--elev-2)]";
            }

            return (
              <button
                key={i}
                onClick={() => onJump(i)}
                title={`${i + 1}. ${TYPE_META[c.type].label}: ${briefLabel(c)}`}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 hover:scale-125 hover:ring-2 hover:ring-white/40 hover:ring-offset-1 hover:ring-offset-[#141e30] ${cls}`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="space-y-1.5">
          {(Object.keys(TYPE_META) as Challenge["type"][]).map(type => {
            const n = counts[type];
            if (!n) return null;
            const m = TYPE_META[type];
            return (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${m.dot}`} />
                <span className="text-[var(--text-faint)] text-xs truncate flex-1">{m.label}</span>
                <span className="text-[var(--text-faint)] text-xs font-mono">{n}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current challenge card */}
      <div className="rounded-2xl p-3.5" style={{ backgroundColor: "var(--navy-card)" }}>
        <p className="text-[var(--text-faint)] text-xs mb-1.5 uppercase tracking-wide font-semibold">Now</p>
        <div className={`flex items-center gap-1.5 text-xs font-bold mb-1 ${meta.color}`}>
          <meta.Icon size={12} />
          {meta.label}
        </div>
        <p className="text-[var(--text-faint)] text-xs leading-snug">{briefLabel(current)}</p>
      </div>

      {/* Dot legend */}
      <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: "var(--navy-card)" }}>
        <p className="text-[var(--text-faint)] text-xs font-semibold uppercase tracking-wide mb-2">Key</p>
        <div className="space-y-1.5">
          {[
            { cls: "bg-sky-400 ring-2 ring-white/50 ring-offset-1 ring-offset-[#141e30]", label: "Current" },
            { cls: "bg-emerald-400", label: "Correct" },
            { cls: "bg-rose-400",    label: "Wrong"   },
            { cls: "bg-indigo-400 opacity-50",  label: "Cards (self)" },
            { cls: "bg-[var(--elev-2)]",   label: "Upcoming" },
          ].map(({ cls, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cls}`} />
              <span className="text-[var(--text-faint)] text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export default function QuizEngine({ challenges, lessonTitle }: { challenges: Challenge[]; lessonTitle: string }) {
  const [idx,     setIdx]     = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [done,    setDone]    = useState(false);

  function advance(correct: boolean | null) {
    const next = [...results, { correct }];
    setResults(next);
    if (idx + 1 >= challenges.length) setDone(true);
    else setIdx(i => i + 1);
  }

  function jump(i: number) {
    setIdx(i);
    setDone(false);
  }

  function reset() { setIdx(0); setResults([]); setDone(false); }

  // ── End screen ──────────────────────────────────────────────────────────────
  if (done) {
    const scored   = results.filter(r => r.correct !== null);
    const correct  = scored.filter(r => r.correct).length;

    return (
      <div className="flex gap-6 items-start fade-in">
        <Sidebar challenges={challenges} idx={challenges.length - 1} results={results} onJump={jump} />

        <div className="flex-1 rounded-2xl p-6 flex flex-col items-center gap-6"
          style={{ backgroundColor: "var(--navy-card)" }}>
          <Trophy size={44} className="text-amber-400 mt-2" />

          <div className="text-center">
            <h2 className="text-[var(--text)] font-bold text-2xl mb-1">Quiz Complete!</h2>
            <p className="text-[var(--text-faint)] text-sm">{lessonTitle}</p>
          </div>

          {scored.length > 0 && (
            <div className="text-center">
              <div className="text-5xl font-bold text-[var(--text)] mb-1">
                {correct}<span className="text-[var(--text-faint)] text-2xl"> / {scored.length}</span>
              </div>
              <p className="text-indigo-300 text-sm font-medium">{perfMsg(correct, scored.length)}</p>
            </div>
          )}

          <div className="w-full max-w-lg space-y-1.5 max-h-64 overflow-y-auto">
            {challenges.map((c, i) => {
              const res = results[i];
              if (!res) return null;
              const m = TYPE_META[c.type];
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--elev-1)] text-xs">
                  <m.Icon size={12} className={`${m.color} shrink-0`} />
                  <span className="flex-1 text-[var(--text-faint)] truncate">{reviewLabel(c)}</span>
                  {res.correct === null
                    ? <span className="text-[var(--text-faint)] shrink-0">cards</span>
                    : res.correct
                    ? <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                    : <XCircle    size={13} className="text-rose-400 shrink-0" />}
                </div>
              );
            })}
          </div>

          <button onClick={reset}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors">
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Active challenge ────────────────────────────────────────────────────────
  const challenge = challenges[idx];
  const meta      = TYPE_META[challenge.type];

  return (
    <div className="flex gap-6 items-start fade-in">
      <Sidebar challenges={challenges} idx={idx} results={results} onJump={jump} />

      <div className="flex-1 rounded-2xl p-6" style={{ backgroundColor: "var(--navy-card)" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-1 text-xs text-[var(--text-faint)]">
          <span className="font-medium truncate pr-4">{lessonTitle}</span>
          <span className="font-mono shrink-0">{idx + 1} / {challenges.length}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-[var(--elev-1)] rounded-full overflow-hidden mb-4">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${(idx / challenges.length) * 100}%` }} />
        </div>

        {/* Type badge */}
        <div className={`flex items-center gap-1.5 text-xs font-semibold mb-5 ${meta.color}`}>
          <meta.Icon size={13} />
          {meta.label}
        </div>

        {/* Challenge — key forces remount */}
        <div key={idx}>
          {challenge.type === "flipcards"       && <FlipCards      challenge={challenge} onComplete={advance} />}
          {challenge.type === "multiple-choice" && <MultipleChoice  challenge={challenge} onComplete={advance} />}
          {challenge.type === "fill-blank"      && <FillBlank      challenge={challenge} onComplete={advance} />}
          {challenge.type === "true-false"      && <TrueFalse      challenge={challenge} onComplete={advance} />}
          {challenge.type === "matching"        && <Matching       challenge={challenge} onComplete={advance} />}
          {challenge.type === "word-order"      && <WordOrder      challenge={challenge} onComplete={advance} />}
        </div>
      </div>
    </div>
  );
}
