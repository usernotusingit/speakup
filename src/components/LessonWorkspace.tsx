"use client";

import { useEffect, useState, type ReactNode } from "react";
import LessonNotes from "./LessonNotes";

const STORAGE_KEY = "speakup:notes-collapsed";

export default function LessonWorkspace({
  bookId,
  lessonId,
  children,
  footer,
}: {
  bookId: number;
  lessonId: number;
  children: ReactNode;
  footer: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Restore the last choice, so hiding the notes before a screen share stays in
  // effect while moving from lesson to lesson.
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* private mode / storage blocked — stay expanded */
    }
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={collapsed ? undefined : "lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6"}>
      {/* Lesson box — row 1, col 1 */}
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">{children}</div>

      {/* Notes — row 1, col 2 when expanded (stretches to match the lesson box
          height); a slim full-width bar under the lesson when collapsed */}
      <div className={collapsed ? "mt-6" : "mt-6 lg:mt-0 lg:col-start-2 lg:row-start-1"}>
        <LessonNotes
          bookId={bookId}
          lessonId={lessonId}
          collapsed={collapsed}
          onToggle={toggle}
        />
      </div>

      {/* Quiz + Prev/Next — row 2, col 1 (below the lesson box) */}
      <div className="min-w-0 lg:col-start-1 lg:row-start-2">{footer}</div>
    </div>
  );
}
