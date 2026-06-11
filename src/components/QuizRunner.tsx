"use client";

import { useState } from "react";
import { CheckCircle, XCircle, RotateCcw, Trophy } from "lucide-react";

type Question = { q: string; options: string[]; answer: number };
type Quiz = { id: number; title: string; level: string; questions: Question[] };

const levelColor: Record<string, string> = {
  A1: "#dc2626", "A1+": "#ea580c", A2: "#2563eb", B1: "#16a34a", "B1/B2": "#1e3a8a",
};

function scoreMessage(correct: number, total: number) {
  const pct = correct / total;
  if (pct === 1) return "Perfect! You nailed it.";
  if (pct >= 0.8) return "Great job! Almost there.";
  if (pct >= 0.6) return "Good effort! Keep practising.";
  return "Keep going — practice makes perfect!";
}

export default function QuizRunner({ quiz }: { quiz: Quiz }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(quiz.questions.length).fill(null));
  const [done, setDone] = useState(false);

  const question = quiz.questions[idx];
  const isAnswered = selected !== null;
  const color = levelColor[quiz.level] ?? "#5c6bc0";

  function choose(optIdx: number) {
    if (isAnswered) return;
    setSelected(optIdx);
    const updated = [...answers];
    updated[idx] = optIdx;
    setAnswers(updated);
  }

  function next() {
    if (idx < quiz.questions.length - 1) {
      setIdx(idx + 1);
      setSelected(null);
    } else {
      setDone(true);
    }
  }

  function restart() {
    setIdx(0);
    setSelected(null);
    setAnswers(Array(quiz.questions.length).fill(null));
    setDone(false);
  }

  const correct = answers.filter((a, i) => a === quiz.questions[i].answer).length;

  if (done) {
    return (
      <div className="rounded-2xl overflow-hidden shadow-xl" style={{ backgroundColor: "var(--navy-card)" }}>
        <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
        <div className="p-8 flex flex-col items-center text-center gap-6">
          <Trophy size={52} className="opacity-80" style={{ color }} />
          <div>
            <p className="text-white/40 text-sm mb-1">{quiz.title}</p>
            <p className="text-white font-bold text-4xl mb-1">
              {correct} / {quiz.questions.length}
            </p>
            <p className="text-white/60 text-sm">{scoreMessage(correct, quiz.questions.length)}</p>
          </div>

          {/* Per-question review */}
          <div className="w-full text-left space-y-2 mt-2">
            {quiz.questions.map((q, i) => {
              const userAns = answers[i];
              const ok = userAns === q.answer;
              return (
                <div key={i} className={`rounded-xl px-4 py-3 flex items-start gap-3 text-sm ${ok ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                  {ok
                    ? <CheckCircle size={16} className="text-green-400 shrink-0 mt-0.5" />
                    : <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 leading-snug mb-1">{q.q}</p>
                    {!ok && (
                      <p className="text-green-300 text-xs">
                        Correct: {q.options[q.answer]}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={restart}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            <RotateCcw size={15} /> Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl" style={{ backgroundColor: "var(--navy-card)" }}>
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-white/8">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${((idx) / quiz.questions.length) * 100}%`, backgroundColor: color }}
        />
      </div>

      <div className="p-6 sm:p-8">
        {/* Counter */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-mono text-white/30">{idx + 1} / {quiz.questions.length}</span>
          <span className="text-xs px-2 py-0.5 rounded-full text-white font-bold"
            style={{ backgroundColor: color }}>{quiz.level}</span>
        </div>

        {/* Question */}
        <p className="text-white font-semibold text-lg leading-snug mb-8">{question.q}</p>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {question.options.map((opt, i) => {
            let style = "border-white/10 bg-white/4 text-white/70 hover:border-white/25 hover:text-white";
            if (isAnswered) {
              if (i === question.answer) style = "border-green-400/60 bg-green-500/15 text-green-200";
              else if (i === selected) style = "border-red-400/60 bg-red-500/15 text-red-200";
              else style = "border-white/5 bg-white/2 text-white/30";
            }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={isAnswered}
                className={`w-full text-left px-5 py-3.5 rounded-xl border text-sm font-medium transition-all ${style} disabled:cursor-default`}
              >
                <span className="font-mono text-xs opacity-50 mr-3">
                  {["A", "B", "C", "D"][i]}.
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Feedback + Next */}
        {isAnswered && (
          <div className="flex items-center justify-between fade-in">
            <div className="flex items-center gap-2 text-sm">
              {selected === question.answer
                ? <><CheckCircle size={16} className="text-green-400" /><span className="text-green-300 font-medium">Correct!</span></>
                : <><XCircle size={16} className="text-red-400" /><span className="text-red-300 font-medium">Wrong</span></>}
            </div>
            <button
              onClick={next}
              className="px-5 py-2 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90"
              style={{ backgroundColor: color }}
            >
              {idx < quiz.questions.length - 1 ? "Next →" : "Finish"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
