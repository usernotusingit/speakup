"use client";

import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

export default function SectionDrill({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => setPlaying(false);
    const onTime = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onError = () => setAvailable(false);

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("error", onError);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const audio = audioRef.current;
      if (!audio || isNaN(audio.duration)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        audio.currentTime = Math.min(audio.currentTime + 0.5, audio.duration);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        audio.currentTime = Math.max(audio.currentTime - 0.5, 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!available) return null;

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * audio.duration;
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={toggle}
        className="w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center shrink-0 transition-colors"
      >
        {playing
          ? <Pause size={13} className="text-white" />
          : <Play  size={13} className="text-white ml-0.5" />}
      </button>

      <Volume2 size={13} className="text-indigo-400 shrink-0" />

      <div
        className="flex-1 h-1.5 bg-indigo-100 rounded-full cursor-pointer relative"
        onClick={seek}
      >
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <span className="text-xs text-indigo-400 shrink-0 font-medium">Listen</span>
    </div>
  );
}
