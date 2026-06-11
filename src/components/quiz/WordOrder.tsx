"use client";

import { useState } from "react";
import type { WordOrderChallenge } from "@/lib/quizGenerator";

interface Props {
  challenge: WordOrderChallenge;
  onComplete: (correct: boolean) => void;
}

interface Tile {
  word: string;
  id: number;
}

export default function WordOrder({ challenge, onComplete }: Props) {
  const [pool, setPool] = useState<Tile[]>(() =>
    challenge.words.map((word, i) => ({ word, id: i }))
  );
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [result, setResult] = useState<boolean | null>(null);

  function addToAnswer(tile: Tile) {
    if (result !== null) return;
    setPool((p) => p.filter((t) => t.id !== tile.id));
    const next = [...placed, tile];
    setPlaced(next);
    // Auto-check when all tiles placed
    if (next.length === challenge.words.length) {
      const attempt = next.map((t) => t.word).join(" ");
      setResult(attempt === challenge.answer);
    }
  }

  function removeFromAnswer(tile: Tile) {
    if (result !== null) return;
    setPlaced((p) => p.filter((t) => t.id !== tile.id));
    setPool((p) => [...p, tile]);
  }

  const isChecked = result !== null;

  return (
    <div className="flex flex-col gap-5 fade-in">
      {/* PT hint */}
      <p className="text-white/40 text-sm italic text-center">{challenge.hint}</p>

      {/* Answer area */}
      <div>
        <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Your answer</p>
        <div
          className={`min-h-[60px] rounded-xl border-2 border-dashed p-3 flex flex-wrap gap-2 transition-colors ${
            !isChecked
              ? "border-white/15"
              : result
              ? "border-emerald-500/60"
              : "border-rose-500/60"
          }`}
        >
          {placed.length === 0 ? (
            <span className="text-white/20 text-sm self-center">Tap words below to build the sentence…</span>
          ) : (
            placed.map((tile) => (
              <button
                key={tile.id}
                onClick={() => removeFromAnswer(tile)}
                disabled={isChecked}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isChecked
                    ? result
                      ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default"
                      : "bg-rose-500/20 border border-rose-500/40 text-rose-300 cursor-default"
                    : "bg-indigo-600/40 border border-indigo-400/40 text-indigo-200 hover:bg-rose-500/20 hover:border-rose-400/40 hover:text-rose-300"
                }`}
              >
                {tile.word}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Word pool */}
      {pool.length > 0 && (
        <div>
          <p className="text-white/30 text-xs uppercase tracking-wider mb-2">Words</p>
          <div className="flex flex-wrap gap-2">
            {pool.map((tile) => (
              <button
                key={tile.id}
                onClick={() => addToAnswer(tile)}
                className="px-3 py-1.5 rounded-lg border border-white/15 text-white/70 hover:border-indigo-400/60 hover:text-white hover:bg-indigo-500/10 text-sm font-medium transition-colors"
              >
                {tile.word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result + Next */}
      {isChecked && (
        <div className="flex flex-col gap-3 fade-in">
          {result ? (
            <p className="text-emerald-400 font-semibold text-sm">Correct! Great work.</p>
          ) : (
            <p className="text-rose-400 text-sm">
              <span className="font-semibold">Oops!</span> The correct answer is:{" "}
              <span className="font-bold text-white/80">{challenge.answer}</span>
            </p>
          )}
          <button
            onClick={() => onComplete(result ?? false)}
            className="self-end px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
