"use client";

import { useState } from "react";
import type { FlipCardsChallenge } from "@/lib/quizGenerator";

interface Props {
  challenge: FlipCardsChallenge;
  onComplete: (correct: null) => void;
}

export default function FlipCards({ challenge, onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [gotIt, setGotIt] = useState(0);
  const [notYet, setNotYet] = useState(0);
  const [done, setDone] = useState(false);

  const cards = challenge.cards;
  const card = cards[idx];
  const total = cards.length;

  function handleGotIt() {
    setGotIt((g) => g + 1);
    advance();
  }

  function handleNotYet() {
    setNotYet((n) => n + 1);
    advance();
  }

  function advance() {
    if (idx + 1 >= total) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setFlipped(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 fade-in">
        <div className="text-5xl">🎴</div>
        <h3 className="text-white font-bold text-xl">Cards Complete!</h3>
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <div className="text-emerald-400 font-bold text-2xl">{gotIt}</div>
            <div className="text-white/50">Got it</div>
          </div>
          <div className="text-center">
            <div className="text-rose-400 font-bold text-2xl">{notYet}</div>
            <div className="text-white/50">Not yet</div>
          </div>
        </div>
        <button
          onClick={() => onComplete(null)}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
        >
          Continue →
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-4 fade-in">
      {/* Badge + progress */}
      <div className="flex items-center justify-between w-full max-w-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-900/40 px-3 py-1 rounded-full">
          {challenge.label}
        </span>
        <span className="text-white/40 text-sm font-mono">
          {idx + 1} / {total}
        </span>
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-sm cursor-pointer"
        style={{ perspective: "1000px", height: "200px" }}
        onClick={() => !flipped && setFlipped(true)}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-white/10 gap-3"
            style={{
              backgroundColor: "var(--navy-card)",
              backfaceVisibility: "hidden",
            }}
          >
            <span className="text-white/30 text-xs uppercase tracking-widest">English</span>
            <span className="text-white font-bold text-2xl text-center px-6">{card.en}</span>
            {!flipped && (
              <span className="text-white/30 text-xs mt-2">Tap to reveal</span>
            )}
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-indigo-500/30 gap-3"
            style={{
              backgroundColor: "var(--navy-card)",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span className="text-indigo-400/60 text-xs uppercase tracking-widest">Português</span>
            <span className="text-indigo-300 font-bold text-2xl text-center px-6">{card.pt}</span>
          </div>
        </div>
      </div>

      {/* Buttons — only after flip */}
      {flipped ? (
        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={handleNotYet}
            className="flex-1 py-3 rounded-xl border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 font-semibold text-sm transition-colors"
          >
            Not yet ✗
          </button>
          <button
            onClick={handleGotIt}
            className="flex-1 py-3 rounded-xl border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-semibold text-sm transition-colors"
          >
            Got it ✓
          </button>
        </div>
      ) : (
        <div className="h-[52px]" />
      )}
    </div>
  );
}
