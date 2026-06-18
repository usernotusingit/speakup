import booksData from "@/data/books.json";
import practiceData from "@/data/books-practice.json";
import { notFound } from "next/navigation";
import LessonView from "@/components/LessonView";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const [{ id, lessonId }, session] = await Promise.all([params, auth()]);
  const role = (session?.user as { role?: string })?.role ?? "student";
  const book = booksData.books.find((b) => b.id === Number(id));
  if (!book) notFound();

  const lessonIdx = book.lessons.findIndex((l) => l.id === Number(lessonId));
  if (lessonIdx === -1) notFound();

  const rawLesson = book.lessons[lessonIdx];
  const prev = book.lessons[lessonIdx - 1] ?? null;
  const next = book.lessons[lessonIdx + 1] ?? null;

  const practiceEntry = role === "teacher"
    ? practiceData.practice.find(
        (p) => p.bookId === Number(id) && p.lessonId === rawLesson.id
      )
    : null;

  const lesson = practiceEntry ? { ...rawLesson, ...practiceEntry } : rawLesson;

  return (
    <div className="fade-in max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/books" className="text-[var(--text-faint)] hover:text-[var(--text)] transition-colors">
          Books
        </Link>
        <span className="text-[var(--text-faint)]">/</span>
        <Link href={`/books/${book.id}`} className="text-[var(--text-faint)] hover:text-[var(--text)] transition-colors">
          {book.title}
        </Link>
        <span className="text-[var(--text-faint)]">/</span>
        <span className="text-[var(--text-muted)] font-medium">{rawLesson.title}</span>
      </div>

      {/* Lesson */}
      <LessonView lesson={lesson} role={role} bookId={book.id} />

      {/* Take Quiz */}
      <div className="mt-6">
        <Link
          href={`/books/${book.id}/lessons/${lesson.id}/quiz`}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition-colors shadow-lg shadow-indigo-900/40"
        >
          <ClipboardList size={18} />
          Take Quiz for this lesson →
        </Link>
      </div>

      {/* Prev / Next */}
      <div className="flex items-center justify-between mt-6">
        {prev ? (
          <Link
            href={`/books/${book.id}/lessons/${prev.id}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--elev-1)] hover:bg-[var(--elev-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-all text-sm"
          >
            <ChevronLeft size={15} />
            <span>{prev.title}</span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/books/${book.id}/lessons/${next.id}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--elev-1)] hover:bg-[var(--elev-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-all text-sm"
          >
            <span>{next.title}</span>
            <ChevronRight size={15} />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
