import quizesData from "@/data/quizes.json";
import { notFound } from "next/navigation";
import QuizRunner from "@/components/QuizRunner";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quiz = quizesData.quizes.find((q) => q.id === Number(id));
  if (!quiz || quiz.questions.length === 0) notFound();

  return (
    <div className="fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/quizes" className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-sm">
          <ChevronLeft size={16} /> Quizzes
        </Link>
        <span className="text-[var(--text-faint)]">/</span>
        <span className="text-[var(--text)] font-semibold">{quiz.title}</span>
      </div>

      <QuizRunner quiz={quiz as { id: number; title: string; level: string; questions: { q: string; options: string[]; answer: number }[] }} />
    </div>
  );
}
