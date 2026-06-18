"use client";

import { useState } from "react";
import type { MultipleChoiceChallenge } from "@/lib/quizGenerator";

interface Props {
  challenge: MultipleChoiceChallenge;
  onComplete: (correct: boolean) => void;
}

const LABELS = ["A", "B", "C", "D"];

export default function MultipleChoice({ challenge, onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  function handleSelect(i: number) {
    if (selected !== null) return;
    setSelected(i);
  }

  const isAnswered = selected !== null;

  function optionClass(i: number): string {
    const base =
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all text-sm font-medium";
    if (!isAnswered) {
      return `${base} border-[var(--border)] text-[var(--text-muted)] hover:border-indigo-400/60 hover:text-[var(--text)] hover:bg-[var(--elev-1)] cursor-pointer`;
    }
    if (i === challenge.answer) {
      return `${base} border-emerald-500 bg-emerald-500/20 text-emerald-300 cursor-default`;
    }
    if (i === selected) {
      return `${base} border-rose-500 bg-rose-500/20 text-rose-300 cursor-default`;
    }
    return `${base} border-[var(--border)] text-[var(--text-faint)] cursor-default`;
  }

  return (
    <div className="flex flex-col gap-5 fade-in">
      {/* Question */}
      <div
        className="rounded-2xl px-6 py-5 border border-[var(--border)]"
        style={{ backgroundColor: "var(--navy-card)" }}
      >
        <p className="text-[var(--text)] font-semibold text-lg leading-snug">{challenge.question}</p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {challenge.options.map((opt, i) => (
          <button key={i} className={optionClass(i)} onClick={() => handleSelect(i)}>
            <span className="font-mono text-xs w-5 shrink-0 text-center opacity-60">{LABELS[i]}</span>
            <span className="flex-1">{opt}</span>
            {isAnswered && i === challenge.answer && (
              <span className="text-emerald-400 text-base shrink-0">✓</span>
            )}
            {isAnswered && i === selected && i !== challenge.answer && (
              <span className="text-rose-400 text-base shrink-0">✗</span>
            )}
          </button>
        ))}
      </div>

      {/* Feedback + Next */}
      {isAnswered && (
        <div className="flex flex-col gap-3 fade-in">
          <p className={`text-sm font-medium ${selected === challenge.answer ? "text-emerald-400" : "text-rose-400"}`}>
            {selected === challenge.answer
              ? "Correct! Well done."
              : `Not quite. The correct answer is: ${challenge.options[challenge.answer]}`}
          </p>
          <button
            onClick={() => onComplete(selected === challenge.answer)}
            className="self-end px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
