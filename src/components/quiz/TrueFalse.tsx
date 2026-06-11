"use client";

import { useState } from "react";
import type { TrueFalseChallenge } from "@/lib/quizGenerator";

interface Props {
  challenge: TrueFalseChallenge;
  onComplete: (correct: boolean) => void;
}

export default function TrueFalse({ challenge, onComplete }: Props) {
  const [selected, setSelected] = useState<boolean | null>(null);

  function handleSelect(value: boolean) {
    if (selected !== null) return;
    setSelected(value);
  }

  const isAnswered = selected !== null;
  const isCorrect = selected === challenge.correct;

  return (
    <div className="flex flex-col gap-5 fade-in">
      {/* Sentence card */}
      <div
        className="rounded-2xl px-6 py-8 border border-white/10 flex flex-col items-center gap-2"
        style={{ backgroundColor: "var(--navy-card)" }}
      >
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Is this correct English?</p>
        <p className="text-white font-bold text-xl text-center leading-snug">{challenge.sentence}</p>
      </div>

      {/* True / False buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSelect(true)}
          disabled={isAnswered}
          className={`py-4 rounded-xl border-2 font-bold text-base transition-all ${
            !isAnswered
              ? "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
              : selected === true
              ? isCorrect
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                : "border-rose-500 bg-rose-500/20 text-rose-300"
              : challenge.correct === true
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
              : "border-white/10 text-white/20"
          }`}
        >
          TRUE ✓
        </button>
        <button
          onClick={() => handleSelect(false)}
          disabled={isAnswered}
          className={`py-4 rounded-xl border-2 font-bold text-base transition-all ${
            !isAnswered
              ? "border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
              : selected === false
              ? isCorrect
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                : "border-rose-500 bg-rose-500/20 text-rose-300"
              : challenge.correct === false
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
              : "border-white/10 text-white/20"
          }`}
        >
          FALSE ✗
        </button>
      </div>

      {/* Feedback + Next */}
      {isAnswered && (
        <div className="flex flex-col gap-3 fade-in">
          <div
            className={`rounded-xl px-4 py-3 border text-sm ${
              isCorrect
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
          >
            <span className="font-bold mr-1">{isCorrect ? "Correct!" : "Not quite."}</span>
            {challenge.explanation}
          </div>
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
