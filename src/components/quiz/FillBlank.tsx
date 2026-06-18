"use client";

import { useState } from "react";
import type { FillBlankChallenge } from "@/lib/quizGenerator";

interface Props {
  challenge: FillBlankChallenge;
  onComplete: (correct: boolean) => void;
}

const LABELS = ["A", "B", "C", "D"];

export default function FillBlank({ challenge, onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  function handleSelect(i: number) {
    if (selected !== null) return;
    setSelected(i);
  }

  const isAnswered = selected !== null;
  const isCorrect = selected === challenge.answer;
  const filledWord = isAnswered ? challenge.options[selected] : null;

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
      {/* Sentence with blank */}
      <div
        className="rounded-2xl px-6 py-5 border border-[var(--border)]"
        style={{ backgroundColor: "var(--navy-card)" }}
      >
        <p className="text-[var(--text)] text-lg font-semibold leading-relaxed">
          {challenge.before && <span>{challenge.before} </span>}
          {filledWord ? (
            <span
              className={`px-2 py-0.5 rounded-lg font-bold ${
                isCorrect ? "text-emerald-300 bg-emerald-500/20" : "text-rose-300 bg-rose-500/20"
              }`}
            >
              {filledWord}
            </span>
          ) : (
            <span className="px-3 py-0.5 rounded-lg border-2 border-dashed border-indigo-400/50 text-indigo-400/70 font-mono text-base">
              ___
            </span>
          )}
          {challenge.after && <span> {challenge.after}</span>}
        </p>
        <p className="text-[var(--text-faint)] text-sm italic mt-2">{challenge.hint}</p>
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
          <p className={`text-sm font-medium ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
            {isCorrect
              ? "Correct! Well done."
              : `Not quite. The correct word is: "${challenge.options[challenge.answer]}"`}
          </p>
          <button
            onClick={() => onComplete(isCorrect)}
            className="self-end px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
