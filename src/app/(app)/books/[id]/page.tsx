import booksData from "@/data/books.json";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = booksData.books.find((b) => b.id === Number(id));
  if (!book) notFound();

  return (
    <div className="fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/books" className="flex items-center gap-1 text-white/60 hover:text-white transition-colors text-sm">
          <ChevronLeft size={16} /> Books
        </Link>
        <span className="text-white/30">/</span>
        <span className="text-white font-semibold">{book.title}</span>
        <span className="text-xs px-2 py-0.5 rounded-full text-white font-bold"
          style={{ backgroundColor: "#5c6bc0" }}>{book.level}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {book.lessons.map((lesson, idx) => (
          <Link key={lesson.id} href={`/books/${book.id}/lessons/${lesson.id}`}>
            <div className="group rounded-2xl bg-white shadow-md hover:shadow-xl hover:scale-105 transition-all cursor-pointer overflow-hidden">
              <div className="px-5 py-6 flex flex-col gap-2">
                <span className="text-xs font-mono text-gray-300">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <p className="text-gray-800 font-semibold leading-snug text-sm">{lesson.title}</p>
              </div>
              <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {lesson.vocabulary?.length ?? 0} words
                </span>
                <span className="text-gray-300 group-hover:text-indigo-400 transition-colors text-sm">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
