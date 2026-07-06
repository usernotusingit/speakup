import booksData from "@/data/books.json";
import Link from "next/link";
import { Lock, ChevronRight } from "lucide-react";
import { buildChallenges } from "@/lib/quizGenerator";

const levelColor: Record<string, string> = {
  A1: "#dc2626", "A1+": "#ea580c", A2: "#2563eb",
  B1: "#16a34a", "B1/B2": "#1e3a8a",
};

type Lesson = (typeof booksData.books)[0]["lessons"][0];

function isReady(lesson: Lesson): boolean {
  return lesson.vocabulary.length >= 10 && lesson.grammarPoints.length >= 3;
}

// Single source of truth: the generator's output length is deterministic
// (shuffle/pick change which items appear, not how many).
function challengeCount(lesson: Lesson): number {
  return buildChallenges(lesson as Parameters<typeof buildChallenges>[0]).length;
}

export default function QuizesPage() {
  return (
    <div className="fade-in space-y-10">
      <h2 className="text-[var(--text)] font-bold text-xl">Quizzes</h2>

      {booksData.books.map((book) => {
        const color = levelColor[book.level] ?? "#5c6bc0";
        return (
          <section key={book.id}>
            {/* Book header */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                {book.level}
              </span>
              <h3 className="text-[var(--text)] font-semibold">{book.title}</h3>
              <div className="flex-1 h-px bg-[var(--elev-1)]" />
              <span className="text-[var(--text-faint)] text-xs">{book.lessons.length} lessons</span>
            </div>

            {/* Lesson cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {book.lessons.map((lesson, idx) => {
                const ready = isReady(lesson);
                const count = ready ? challengeCount(lesson) : 0;

                return ready ? (
                  <Link
                    key={lesson.id}
                    href={`/books/${book.id}/lessons/${lesson.id}/quiz`}
                    className="group rounded-2xl border border-[var(--border)] hover:border-[var(--border)] transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: "var(--navy-card)" }}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-xs font-mono text-[var(--text-faint)]">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: color + "33", color }}
                        >
                          {count} challenges
                        </span>
                      </div>
                      <p className="text-[var(--text-muted)] font-semibold text-sm leading-snug mb-4">
                        {lesson.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {["indigo", "sky", "amber", "purple", "emerald", "rose"].map((c) => (
                            <div key={c} className={`w-1.5 h-1.5 rounded-full bg-${c}-400`} />
                          ))}
                        </div>
                        <span className="flex items-center gap-1 text-xs font-semibold text-[var(--text-faint)] group-hover:text-[var(--text)] transition-colors">
                          Take Quiz <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div
                    key={lesson.id}
                    className="rounded-2xl border border-[var(--border)] opacity-45"
                    style={{ backgroundColor: "var(--navy-card)" }}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-xs font-mono text-[var(--text-faint)]">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <Lock size={13} className="text-[var(--text-faint)] mt-0.5" />
                      </div>
                      <p className="text-[var(--text-faint)] font-semibold text-sm leading-snug mb-4">
                        {lesson.title}
                      </p>
                      <p className="text-[var(--text-faint)] text-xs">Coming soon</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
