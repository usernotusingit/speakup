"use client";

import { useState } from "react";
import SectionDrill from "@/components/SectionDrill";
import CheckpointSpotlight, { type Checkpoint } from "@/components/CheckpointSpotlight";
import {
  BookOpen,
  MessageCircle,
  List,
  Lightbulb,
  Smile,
  Globe,
  GraduationCap,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Dumbbell,
} from "lucide-react";

type PracticeSentence = { pt: string; en: string };

type Lesson = {
  id: number | string;
  title: string;
  verbs: { en: string; pt: string }[];
  grammarPoints: { en: string; pt: string }[];
  vocabulary: { en: string; pt: string }[];
  expressions: { en: string; pt: string }[];
  curiosity: string;
  teachingGuide: string;
  checkpoint?: Checkpoint;
  homework?: string[];
  readingText?: {
    title: string;
    body: string;
    glossary?: { en: string; pt: string }[];
  };
  // teacher-only practice fields
  practiceVerbs?: PracticeSentence[];
  practiceVocabulary?: PracticeSentence[];
  practiceExpressions?: PracticeSentence[];
  practicingPart2?: PracticeSentence[];
};

// ─── Section content renderer ────────────────────────────────────────────────

function SectionContent({ sectionKey, lesson }: { sectionKey: string; lesson: Lesson }) {
  switch (sectionKey) {
    case "verbs":
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {lesson.verbs.map((v, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-50">
              <span className="text-sm font-semibold text-indigo-700 leading-snug">{v.en}</span>
              <span className="text-gray-300 text-xs mt-0.5 shrink-0">—</span>
              <span className="text-sm text-gray-600 leading-snug">{v.pt}</span>
            </div>
          ))}
        </div>
      );

    case "grammarPoints":
      return (
        <div className="space-y-2">
          {lesson.grammarPoints.map((g, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-2.5 rounded-lg bg-gray-50"
            >
              <span className="text-sm font-semibold text-gray-800 leading-snug">{g.en}</span>
              <span className="text-gray-300 hidden sm:inline shrink-0">·</span>
              <span className="text-sm text-gray-500 italic leading-snug">{g.pt}</span>
            </div>
          ))}
        </div>
      );

    case "readingText":
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <h4 className="text-sm font-bold text-gray-700 mb-3">{lesson.readingText!.title}</h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {lesson.readingText!.body}
            </p>
          </div>
          {lesson.readingText!.glossary && lesson.readingText!.glossary.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {lesson.readingText!.glossary.map((g, i) => (
                <div key={i} className="flex justify-between gap-2 p-2 rounded-lg bg-sky-50 text-sm">
                  <span className="font-semibold text-sky-800">{g.en}</span>
                  <span className="text-gray-500 text-right">{g.pt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case "vocabulary":
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {lesson.vocabulary.map((v, i) => (
            <div key={i} className="flex justify-between gap-2 p-2 rounded-lg bg-gray-50 text-sm">
              <span className="font-semibold text-gray-800">{v.en}</span>
              <span className="text-gray-500 text-right">{v.pt}</span>
            </div>
          ))}
        </div>
      );

    case "expressions":
      return (
        <div className="space-y-2">
          {lesson.expressions.map((e, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-yellow-50">
              <span className="text-sm font-semibold text-yellow-800 leading-snug">{e.en}</span>
              <span className="text-gray-300 shrink-0">—</span>
              <span className="text-sm text-gray-600 leading-snug">{e.pt}</span>
            </div>
          ))}
        </div>
      );

    case "curiosity":
      return (
        <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 flex gap-3">
          <Globe size={16} className="text-sky-500 mt-0.5 shrink-0" />
          <p className="text-sm text-sky-800">{lesson.curiosity}</p>
        </div>
      );

    case "teachingGuide":
      return (
        <div className="p-4 rounded-xl bg-green-50 border border-green-100">
          <p className="text-sm text-green-800 whitespace-pre-line leading-relaxed">
            {lesson.teachingGuide}
          </p>
        </div>
      );

    case "homework":
      return (
        <div>
          <p className="text-xs text-gray-400 mb-3">Translate these sentences into English.</p>
          <ol className="space-y-2">
            {lesson.homework!.map((sentence, i) => (
              <li key={i} className="flex gap-3 text-sm p-3 rounded-lg bg-rose-50 border border-rose-100">
                <span className="text-rose-400 font-bold shrink-0 w-5 text-right">{i + 1}.</span>
                <span className="text-gray-700 italic">{sentence}</span>
              </li>
            ))}
          </ol>
        </div>
      );

    case "practiceVerbs":
    case "practiceVocabulary":
    case "practiceExpressions":
    case "practicingPart2": {
      const items = lesson[sectionKey as keyof Lesson] as PracticeSentence[] | undefined;
      if (!items?.length) return null;
      return (
        <div className="space-y-2">
          {items.map((s, i) => (
            <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-violet-50 border border-violet-100">
              <span className="text-sm text-gray-500 italic leading-snug">{s.pt}</span>
              <span className="text-sm font-semibold text-violet-800 leading-snug">{s.en}</span>
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

const TEACHER_ONLY_SECTIONS = new Set([
  "teachingGuide",
  "practiceVerbs",
  "practiceVocabulary",
  "practiceExpressions",
  "practicingPart2",
]);

const DRILL_SECTIONS = new Set(["verbs", "grammarPoints", "expressions", "vocabulary", "readingText"]);

const DRILL_FILE: Record<string, string> = {
  verbs:        "verbs.mp3",
  grammarPoints: "grammar.mp3",
  expressions:  "expressions.mp3",
  vocabulary:   "vocabulary.mp3",
  readingText:  "reading.mp3",
};

export default function LessonView({ lesson, role = "student", bookId }: { lesson: Lesson; role?: string; bookId?: number }) {
  const isTeacher = role === "teacher";
  const [open, setOpen] = useState<string | null>("verbs");

  type SectionDef = { key: string; label: string; Icon: React.ElementType; color: string };
  const sections: SectionDef[] = [];

  if (lesson.verbs.length > 0) {
    sections.push({ key: "verbs", label: "Verbs", Icon: BookOpen, color: "#5c6bc0" });
  }
  sections.push({ key: "grammarPoints", label: "Grammar Points", Icon: MessageCircle, color: "#7986cb" });
  if (lesson.readingText) {
    sections.push({ key: "readingText", label: "Reading", Icon: BookOpen, color: "#0891b2" });
  }
  if (lesson.vocabulary.length > 0) {
    sections.push({ key: "vocabulary", label: "Vocabulary", Icon: List, color: "#5c6bc0" });
  }
  if (lesson.expressions.length > 0) {
    sections.push({ key: "expressions", label: "Expressions", Icon: Smile, color: "#7986cb" });
  }
  sections.push({ key: "curiosity", label: "Curiosity", Icon: Globe, color: "#0ea5e9" });
  sections.push({ key: "teachingGuide", label: "Teaching Guide", Icon: GraduationCap, color: "#16a34a" });
  if (lesson.homework?.length) {
    sections.push({ key: "homework", label: "Homework", Icon: ClipboardList, color: "#dc2626" });
  }
  if (lesson.practiceVerbs?.length) {
    sections.push({ key: "practiceVerbs", label: "Practice — Verbs", Icon: Dumbbell, color: "#7c3aed" });
  }
  if (lesson.practiceVocabulary?.length) {
    sections.push({ key: "practiceVocabulary", label: "Practice — Vocabulary", Icon: Dumbbell, color: "#7c3aed" });
  }
  if (lesson.practiceExpressions?.length) {
    sections.push({ key: "practiceExpressions", label: "Practice — Expressions", Icon: Dumbbell, color: "#7c3aed" });
  }
  if (lesson.practicingPart2?.length) {
    sections.push({ key: "practicingPart2", label: "Practicing — Part II", Icon: Dumbbell, color: "#6d28d9" });
  }

  // suppress unused import warning
  void Lightbulb;

  return (
    <div id={`lesson-${lesson.id}`} className="rounded-2xl overflow-hidden shadow-lg bg-white">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-gray-800 font-bold text-lg">{lesson.title}</h3>
      </div>

      {lesson.checkpoint && (
        <div className="px-4 pt-4">
          <CheckpointSpotlight checkpoint={lesson.checkpoint} />
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {sections
          .filter(({ key }) => isTeacher || !TEACHER_ONLY_SECTIONS.has(key))
          .map(({ key, label, Icon, color }) => {
            const isOpen = open === key;
            return (
              <div key={key}>
                <button
                  onClick={() => setOpen(isOpen ? null : key)}
                  className="w-full flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color + "22" }}
                  >
                    <Icon size={14} style={{ color }} />
                  </div>
                  <span className="font-semibold text-gray-700 text-sm flex-1">{label}</span>
                  {isOpen ? (
                    <ChevronUp size={16} className="text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-2 slide-in space-y-3">
                    <SectionContent sectionKey={key} lesson={lesson} />
                    {bookId && DRILL_SECTIONS.has(key) && (
                      <SectionDrill
                        src={`/audio/lessons/${bookId}/${lesson.id}/${DRILL_FILE[key]}`}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
