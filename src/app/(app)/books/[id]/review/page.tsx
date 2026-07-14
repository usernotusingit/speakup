import booksData from "@/data/books.json";
import { notFound } from "next/navigation";
import LessonView from "@/components/LessonView";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, session] = await Promise.all([params, auth()]);
  const role = (session?.user as { role?: string })?.role ?? "student";
  const book = booksData.books.find((b) => b.id === Number(id));
  if (!book || !book.midReview) notFound();

  const review = book.midReview;
  const prev = book.lessons.find((l) => l.id === 18) ?? null;
  const next = book.lessons.find((l) => l.id === 19) ?? null;

  return (
    <div className="fade-in max-w-3xl lg:max-w-6xl mx-auto">
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
        <span className="text-[var(--text-muted)] font-medium">{review.title}</span>
      </div>

      <div className="min-w-0">
        <LessonView lesson={review} role={role} bookId={book.id} />

        {/* Prev / Next (into the surrounding lessons) */}
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
    </div>
  );
}
