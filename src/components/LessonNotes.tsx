"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  StickyNote,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function LessonNotes({
  bookId,
  lessonId,
  collapsed,
  onToggle,
}: {
  bookId: number;
  lessonId: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef("");
  const loaded = useRef(false);

  // Moving to another lesson invalidates whatever was loaded.
  useEffect(() => {
    setContent("");
    setState("idle");
    setLoading(true);
    lastSaved.current = "";
    loaded.current = false;
  }, [bookId, lessonId]);

  // Load existing note, but only once the panel is actually open: a collapsed
  // panel must never pull the note text into the page, since the whole point of
  // collapsing is to keep it off a shared screen.
  useEffect(() => {
    if (collapsed || loaded.current) return;
    let active = true;
    setLoading(true);
    fetch(`/api/lesson-notes?bookId=${bookId}&lessonId=${lessonId}`)
      .then((r) => (r.ok ? r.json() : { content: "" }))
      .then((data) => {
        if (!active) return;
        setContent(data.content ?? "");
        lastSaved.current = data.content ?? "";
        loaded.current = true;
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [bookId, lessonId, collapsed]);

  const save = useCallback(
    async (value: string) => {
      setState("saving");
      try {
        const res = await fetch("/api/lesson-notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId, lessonId, content: value }),
        });
        if (!res.ok) throw new Error();
        lastSaved.current = value;
        setState("saved");
      } catch {
        setState("error");
      }
    },
    [bookId, lessonId]
  );

  function onChange(value: string) {
    setContent(value);
    setState("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (value !== lastSaved.current) save(value);
    }, 800);
  }

  // Flush immediately when the field loses focus (e.g. before navigating away,
  // or when the panel is collapsed), so a pending debounced save is never
  // dropped by the component unmounting.
  function onBlur() {
    if (timer.current) clearTimeout(timer.current);
    if (content !== lastSaved.current) save(content);
  }

  // Flush on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (collapsed) {
    return (
      <aside className="rounded-2xl overflow-hidden shadow-lg bg-white">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-amber-100">
            <StickyNote size={14} className="text-amber-600" />
          </div>
          <span className="font-semibold text-gray-700 text-sm">My Notes</span>
          <span className="text-xs text-gray-400 flex-1">Hidden</span>
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl overflow-hidden shadow-lg bg-white flex flex-col lg:h-full">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-amber-100">
          <StickyNote size={14} className="text-amber-600" />
        </div>
        <span className="font-semibold text-gray-700 text-sm flex-1">My Notes</span>
        <StatusBadge loading={loading} state={state} />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={true}
          title="Hide notes"
          className="w-7 h-7 -mr-1.5 rounded-lg flex items-center justify-center shrink-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ChevronUp size={16} />
        </button>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={loading}
          placeholder="Take notes about this lesson…"
          rows={12}
          className="w-full flex-1 min-h-[16rem] resize-y rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-700 leading-relaxed placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 disabled:opacity-50"
        />
        <p className="mt-2 text-xs text-gray-400">
          Only you can see these notes. They save automatically.
        </p>
      </div>
    </aside>
  );
}

function StatusBadge({ loading, state }: { loading: boolean; state: SaveState }) {
  if (loading) {
    return <Loader2 size={15} className="text-gray-300 animate-spin shrink-0" />;
  }
  if (state === "saving") {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
        <Loader2 size={13} className="animate-spin" /> Saving
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600 shrink-0">
        <Check size={13} /> Saved
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="flex items-center gap-1 text-xs text-red-500 shrink-0">
        <AlertCircle size={13} /> Retry
      </span>
    );
  }
  return null;
}
