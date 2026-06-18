"use client";

import { useState, useEffect, useRef } from "react";
import type { MatchingChallenge } from "@/lib/quizGenerator";

interface Props {
  challenge: MatchingChallenge;
  onComplete: (correct: boolean) => void;
}

const PAIR_COLORS = [
  "border-indigo-400 bg-indigo-400/20 text-indigo-300",
  "border-emerald-400 bg-emerald-400/20 text-emerald-300",
  "border-amber-400 bg-amber-400/20 text-amber-300",
  "border-rose-400 bg-rose-400/20 text-rose-300",
  "border-sky-400 bg-sky-400/20 text-sky-300",
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Matching({ challenge, onComplete }: Props) {
  const pairs = challenge.pairs;

  // rightItems: EN items in shuffled order
  const [rightItems] = useState<string[]>(() => shuffleArray(pairs.map((p) => p.en)));
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  // leftIdx → rightIdx (in rightItems)
  const [matchedPairs, setMatchedPairs] = useState<Map<number, number>>(new Map());
  const [wrongAttempt, setWrongAttempt] = useState<{ left: number; right: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    };
  }, []);

  const allMatched = matchedPairs.size === pairs.length;

  // Map: leftIdx → colorIdx (assigned when matched)
  const leftColorMap = new Map<number, number>();
  let colorCounter = 0;
  for (const [leftIdx] of matchedPairs) {
    leftColorMap.set(leftIdx, colorCounter++);
  }

  // Map: rightIdx (in rightItems) → colorIdx
  const rightColorMap = new Map<number, number>();
  for (const [leftIdx, rightIdx] of matchedPairs) {
    const colorIdx = leftColorMap.get(leftIdx) ?? 0;
    rightColorMap.set(rightIdx, colorIdx);
  }

  function handleLeftClick(i: number) {
    if (matchedPairs.has(i)) return;
    setSelectedLeft(i);
  }

  function handleRightClick(j: number) {
    if (selectedLeft === null) return;
    // Check if right item already matched
    for (const [, rIdx] of matchedPairs) {
      if (rIdx === j) return;
    }

    const correctEN = pairs[selectedLeft].en;
    if (rightItems[j] === correctEN) {
      // Correct match
      setMatchedPairs((prev) => {
        const next = new Map(prev);
        next.set(selectedLeft, j);
        return next;
      });
      setSelectedLeft(null);
    } else {
      // Wrong
      setMistakes((m) => m + 1);
      setWrongAttempt({ left: selectedLeft, right: j });
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => {
        setWrongAttempt(null);
        setSelectedLeft(null);
      }, 500);
    }
  }

  function leftBtnClass(i: number): string {
    const base = "w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all";
    if (matchedPairs.has(i)) {
      const ci = leftColorMap.get(i) ?? 0;
      return `${base} ${PAIR_COLORS[ci % PAIR_COLORS.length]} cursor-default`;
    }
    if (wrongAttempt?.left === i) {
      return `${base} border-rose-500 bg-rose-500/20 text-rose-300`;
    }
    if (selectedLeft === i) {
      return `${base} border-indigo-400 bg-indigo-400/10 text-indigo-200`;
    }
    return `${base} border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border)] hover:text-[var(--text)] cursor-pointer`;
  }

  function rightBtnClass(j: number): string {
    const base = "w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all";
    // Check if matched
    for (const [, rIdx] of matchedPairs) {
      if (rIdx === j) {
        const ci = rightColorMap.get(j) ?? 0;
        return `${base} ${PAIR_COLORS[ci % PAIR_COLORS.length]} cursor-default`;
      }
    }
    if (wrongAttempt?.right === j) {
      return `${base} border-rose-500 bg-rose-500/20 text-rose-300`;
    }
    return `${base} border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border)] hover:text-[var(--text)] cursor-pointer`;
  }

  return (
    <div className="flex flex-col gap-5 fade-in">
      <p className="text-[var(--text-faint)] text-sm text-center">
        Select a Portuguese word, then its English match.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column: PT */}
        <div className="flex flex-col gap-2">
          <p className="text-[var(--text-faint)] text-xs uppercase tracking-wider text-center mb-1">Português</p>
          {pairs.map((pair, i) => (
            <button key={i} className={leftBtnClass(i)} onClick={() => handleLeftClick(i)}>
              {pair.pt}
            </button>
          ))}
        </div>

        {/* Right column: EN (shuffled) */}
        <div className="flex flex-col gap-2">
          <p className="text-[var(--text-faint)] text-xs uppercase tracking-wider text-center mb-1">English</p>
          {rightItems.map((en, j) => (
            <button key={j} className={rightBtnClass(j)} onClick={() => handleRightClick(j)}>
              {en}
            </button>
          ))}
        </div>
      </div>

      {mistakes > 0 && !allMatched && (
        <p className="text-rose-400/60 text-xs text-center">{mistakes} mistake{mistakes !== 1 ? "s" : ""} so far</p>
      )}

      {allMatched && (
        <div className="flex flex-col items-center gap-3 fade-in">
          <p className="text-emerald-400 font-semibold">All matched!</p>
          <button
            onClick={() => onComplete(mistakes === 0)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
