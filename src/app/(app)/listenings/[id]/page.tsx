import listeningsData from "@/data/listenings.json";
import booksData from "@/data/books.json";
import { notFound } from "next/navigation";
import Link from "next/link";
import ListeningPlayer from "@/components/ListeningPlayer";

export default async function ListeningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listening = listeningsData.listenings.find((l) => l.id === Number(id));
  if (!listening) notFound();

  const book = booksData.books.find((b) => b.id === listening.bookId);
  const lesson = book?.lessons.find((l) => l.id === listening.lessonId);

  return (
    <div className="fade-in max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
        <Link href="/listenings" className="text-white/40 hover:text-white transition-colors">Listening</Link>
        <span className="text-white/20">/</span>
        {lesson && book && (
          <>
            <Link
              href={`/books/${book.id}/lessons/${lesson.id}`}
              className="text-white/40 hover:text-white transition-colors"
            >
              {lesson.title}
            </Link>
            <span className="text-white/20">/</span>
          </>
        )}
        <span className="text-white/80 font-medium">{listening.title}</span>
      </div>

      <ListeningPlayer listening={listening} />
    </div>
  );
}
