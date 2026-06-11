import booksData from "@/data/books.json";
import { notFound } from "next/navigation";
import Link from "next/link";
import { buildChallenges } from "@/lib/quizGenerator";
import QuizEngine from "@/components/QuizEngine";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const book = booksData.books.find((b) => b.id === Number(id));
  if (!book) notFound();

  const lesson = book.lessons.find((l) => l.id === Number(lessonId));
  if (!lesson) notFound();

  if (lesson.vocabulary.length < 10 || lesson.grammarPoints.length < 3) {
    return (
      <div className="fade-in max-w-lg mx-auto mt-8">
        <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
          <Link href="/books" className="text-white/40 hover:text-white transition-colors">Books</Link>
          <span className="text-white/20">/</span>
          <Link href={`/books/${book.id}`} className="text-white/40 hover:text-white transition-colors">{book.title}</Link>
          <span className="text-white/20">/</span>
          <Link href={`/books/${book.id}/lessons/${lesson.id}`} className="text-white/40 hover:text-white transition-colors">{lesson.title}</Link>
          <span className="text-white/20">/</span>
          <span className="text-white/80 font-medium">Quiz</span>
        </div>
        <div className="rounded-2xl p-10 flex flex-col items-center gap-4 border border-white/10"
          style={{ backgroundColor: "var(--navy-card)" }}>
          <div className="text-5xl">📚</div>
          <h2 className="text-white font-bold text-xl">Quiz Not Ready Yet</h2>
          <p className="text-white/50 text-sm text-center max-w-sm">
            This lesson doesn&apos;t have enough content for a full quiz yet.
          </p>
          <Link href={`/books/${book.id}/lessons/${lesson.id}`}
            className="mt-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-colors">
            Back to Lesson
          </Link>
        </div>
      </div>
    );
  }

  const challenges = buildChallenges(lesson as Parameters<typeof buildChallenges>[0]);

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
        <Link href="/books" className="text-white/40 hover:text-white transition-colors">Books</Link>
        <span className="text-white/20">/</span>
        <Link href={`/books/${book.id}`} className="text-white/40 hover:text-white transition-colors">{book.title}</Link>
        <span className="text-white/20">/</span>
        <Link href={`/books/${book.id}/lessons/${lesson.id}`} className="text-white/40 hover:text-white transition-colors">{lesson.title}</Link>
        <span className="text-white/20">/</span>
        <span className="text-white/80 font-medium">Quiz</span>
      </div>

      <QuizEngine challenges={challenges} lessonTitle={lesson.title} />
    </div>
  );
}
