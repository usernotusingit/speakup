"use client";

import { useState, useRef } from "react";
import {
  Headphones, BookOpen, CheckCircle, XCircle,
  ChevronRight, RotateCcw, Trophy, Play, Pause,
} from "lucide-react";

type DialogueLine = { speaker: string; line: string };
type Question = { id: number; question: string; options: string[]; answer: number };
type Listening = {
  id: number;
  title: string;
  level: string;
  duration: string;
  description: string;
  focusVerbs: string[];
  focusExpressions: string[];
  dialogue: DialogueLine[];
  questions: Question[];
};

const SPEAKER_COLORS: Record<string, string> = {
  A: "bg-indigo-500/20 border-indigo-500/30",
  B: "bg-sky-500/20 border-sky-500/30",
};
const SPEAKER_NAME_COLORS: Record<string, string> = {
  A: "text-indigo-300",
  B: "text-sky-300",
};

function assignSpeakerSlots(dialogue: DialogueLine[]): string[] {
  const seen: string[] = [];
  return dialogue.map(({ speaker }) => {
    if (!seen.includes(speaker)) seen.push(speaker);
    return seen.indexOf(speaker) === 0 ? "A" : "B";
  });
}

// ─── Phases ──────────────────────────────────────────────────────────────────

type Phase = "read" | "quiz" | "done";

function AudioPlayer({ listeningId }: { listeningId: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else         { a.play(); setPlaying(true); }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Number(e.target.value);
    setProgress(Number(e.target.value));
  }

  function restart() {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    setProgress(0);
    a.play();
    setPlaying(true);
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: "var(--navy-card)" }}>
      <audio
        ref={audioRef}
        src={`/audio/listenings/${listeningId}.mp3`}
        onTimeUpdate={(e) => setProgress((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onEnded={() => setPlaying(false)}
      />
      <button onClick={toggle}
        className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center shrink-0 transition-colors">
        {playing ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <input
          type="range" min={0} max={duration || 1} step={0.1} value={progress}
          onChange={seek}
          className="w-full h-1 accent-indigo-500 cursor-pointer"
        />
        <div className="flex justify-between mt-1 text-white/25 text-xs font-mono">
          <span>{fmt(progress)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
      <button onClick={restart} className="text-white/30 hover:text-white/70 transition-colors">
        <RotateCcw size={15} />
      </button>
    </div>
  );
}

function ReadPhase({
  listening,
  slots,
  onNext,
}: {
  listening: Listening;
  slots: string[];
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Audio player */}
      <AudioPlayer listeningId={listening.id} />

      {/* Focus chips */}
      <div className="rounded-2xl p-4" style={{ backgroundColor: "var(--navy-card)" }}>
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">Focus</p>
        <div className="flex flex-wrap gap-2">
          {listening.focusVerbs.map((v) => (
            <span key={v} className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
              {v}
            </span>
          ))}
          {listening.focusExpressions.map((e) => (
            <span key={e} className="text-xs px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium">
              {e}
            </span>
          ))}
        </div>
      </div>

      {/* Dialogue */}
      <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: "var(--navy-card)" }}>
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4">Dialogue</p>
        {listening.dialogue.map((line, i) => {
          const slot = slots[i];
          const isRight = slot === "B";
          return (
            <div key={i} className={`flex gap-3 ${isRight ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border ${SPEAKER_COLORS[slot]} ${SPEAKER_NAME_COLORS[slot]}`}>
                {line.speaker[0]}
              </div>
              <div className={`flex flex-col ${isRight ? "items-end" : "items-start"} max-w-[80%]`}>
                <span className={`text-xs font-semibold mb-1 ${SPEAKER_NAME_COLORS[slot]}`}>
                  {line.speaker}
                </span>
                <div className={`rounded-2xl px-4 py-2.5 border text-sm text-white/85 leading-relaxed ${SPEAKER_COLORS[slot]}`}>
                  {line.line}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
      >
        <BookOpen size={16} />
        Comprehension Check
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

function QuizPhase({
  questions,
  onDone,
}: {
  questions: Question[];
  onDone: (answers: (number | null)[]) => void;
}) {
  const [current, setCurrent]     = useState(0);
  const [selected, setSelected]   = useState<number | null>(null);
  const [revealed, setRevealed]   = useState(false);
  const [answers, setAnswers]     = useState<(number | null)[]>([]);

  const q = questions[current];

  function pick(i: number) {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
  }

  function advance() {
    const next = [...answers, selected];
    if (current + 1 >= questions.length) {
      onDone(next);
    } else {
      setAnswers(next);
      setCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  }

  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: "var(--navy-card)" }}>
      {/* Progress */}
      <div className="flex items-center justify-between mb-1 text-xs text-white/35">
        <span className="font-medium">Comprehension Check</span>
        <span className="font-mono">{current + 1} / {questions.length}</span>
      </div>
      <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${(current / questions.length) * 100}%` }}
        />
      </div>

      <p className="text-white font-semibold text-base mb-5 leading-snug">{q.question}</p>

      <div className="space-y-2.5 mb-6">
        {q.options.map((opt, i) => {
          let cls = "border border-white/10 bg-white/4 text-white/70";
          if (revealed) {
            if (i === q.answer) cls = "border border-emerald-500/60 bg-emerald-500/15 text-emerald-300";
            else if (i === selected) cls = "border border-rose-500/60 bg-rose-500/15 text-rose-300";
            else cls = "border border-white/5 bg-white/2 text-white/30";
          } else if (selected === i) {
            cls = "border border-indigo-400/60 bg-indigo-500/20 text-white";
          }
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${cls} ${!revealed ? "hover:border-white/25 hover:bg-white/8" : ""}`}
            >
              <span className="text-white/30 font-mono mr-3">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {revealed && (
        <button
          onClick={advance}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
        >
          {current + 1 < questions.length ? "Next question" : "See results"}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function DonePhase({
  questions,
  answers,
  onReset,
}: {
  questions: Question[];
  answers: (number | null)[];
  onReset: () => void;
}) {
  const correct = answers.filter((a, i) => a === questions[i].answer).length;
  const total   = questions.length;
  const pct     = correct / total;

  const msg =
    pct === 1   ? "Perfect! You understood everything." :
    pct >= 0.8  ? "Great job! Almost perfect." :
    pct >= 0.6  ? "Good effort! Keep practising." :
    "Listen again and try once more!";

  return (
    <div className="rounded-2xl p-6 flex flex-col items-center gap-6" style={{ backgroundColor: "var(--navy-card)" }}>
      <Trophy size={40} className="text-amber-400 mt-2" />
      <div className="text-center">
        <h2 className="text-white font-bold text-xl mb-1">Listening Complete!</h2>
        <div className="text-4xl font-bold text-white mt-4 mb-1">
          {correct}<span className="text-white/30 text-xl"> / {total}</span>
        </div>
        <p className="text-indigo-300 text-sm font-medium mt-1">{msg}</p>
      </div>

      <div className="w-full space-y-2">
        {questions.map((q, i) => {
          const ok = answers[i] === q.answer;
          return (
            <div key={q.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl border border-white/5 bg-white/3 text-xs">
              {ok
                ? <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                : <XCircle    size={13} className="text-rose-400 shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className="text-white/60 truncate">{q.question}</p>
                {!ok && (
                  <p className="text-emerald-400/70 text-xs mt-0.5">
                    ✓ {q.options[q.answer]}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-2 px-8 py-3 bg-white/8 hover:bg-white/12 text-white/70 hover:text-white font-semibold rounded-xl transition-colors text-sm"
      >
        <RotateCcw size={14} />
        Try again
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ListeningPlayer({ listening }: { listening: Listening }) {
  const [phase, setPhase]     = useState<Phase>("read");
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const slots = assignSpeakerSlots(listening.dialogue);

  function reset() {
    setPhase("read");
    setAnswers([]);
  }

  return (
    <div className="fade-in space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4 rounded-2xl p-5" style={{ backgroundColor: "var(--navy-card)" }}>
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <Headphones size={22} className="text-indigo-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-bold text-lg leading-tight">{listening.title}</h1>
          <p className="text-white/45 text-sm mt-1 leading-relaxed">{listening.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-white/30">{listening.duration}</span>
            <span className="text-white/15">·</span>
            <span className="text-xs text-white/30">{listening.dialogue.length} lines</span>
            <span className="text-white/15">·</span>
            <span className="text-xs text-white/30">{listening.questions.length} questions</span>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-600/20 text-rose-400 border border-rose-500/30 shrink-0">
          {listening.level}
        </span>
      </div>

      {/* Phase tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: "var(--navy-card)" }}>
        {(["read", "quiz", "done"] as Phase[]).map((p) => (
          <button
            key={p}
            onClick={() => p !== "done" && setPhase(p)}
            disabled={p === "done"}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors capitalize
              ${phase === p ? "bg-indigo-600 text-white" : "text-white/35 hover:text-white/60 disabled:cursor-default disabled:hover:text-white/20"}`}
          >
            {p === "read" ? "Dialogue" : p === "quiz" ? "Questions" : "Results"}
          </button>
        ))}
      </div>

      {/* Content */}
      {phase === "read" && (
        <ReadPhase listening={listening} slots={slots} onNext={() => setPhase("quiz")} />
      )}
      {phase === "quiz" && (
        <QuizPhase
          questions={listening.questions}
          onDone={(ans) => { setAnswers(ans); setPhase("done"); }}
        />
      )}
      {phase === "done" && (
        <DonePhase questions={listening.questions} answers={answers} onReset={reset} />
      )}
    </div>
  );
}
