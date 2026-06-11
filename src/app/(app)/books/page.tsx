import booksData from "@/data/books.json";
import Link from "next/link";

const levelBadgeColors: Record<string, string> = {
  A1: "#dc2626",
  "A1+": "#ea580c",
  A2: "#2563eb",
  B1: "#16a34a",
  "B1/B2": "#1e3a8a",
};

export default function BooksPage() {
  return (
    <div className="fade-in">
      <h2 className="text-white font-bold text-xl mb-6">Books</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {booksData.books.map((book) => (
          <Link key={book.id} href={`/books/${book.id}`}>
            <div className="group rounded-2xl overflow-hidden shadow-lg cursor-pointer
              transition-all hover:scale-105 hover:shadow-xl"
              style={{ backgroundColor: levelBadgeColors[book.level] ?? "#5c6bc0" }}>
              {/* Cover area */}
              <div className="relative aspect-[3/4] flex flex-col items-center justify-center p-4">
                <div className="absolute top-2 right-2 text-xs font-bold bg-white/20 text-white
                  px-2 py-0.5 rounded-full">{book.level}</div>
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-2">
                  <span className="text-2xl">📖</span>
                </div>
                <p className="text-white font-bold text-center text-sm leading-tight">
                  {book.title}
                </p>
              </div>
              {/* Footer */}
              <div className="bg-black/20 px-3 py-2 flex items-center justify-between">
                <span className="text-white/70 text-xs">{book.lessons.length} lessons</span>
                <span className="text-white/70 text-xs group-hover:text-white transition-colors">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
