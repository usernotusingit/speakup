#!/usr/bin/env python3
"""Parallel driver for books 1-3 (book1 L6-36, all book2, all book3).
Each output mp3 is one work unit, run across a thread pool. Skips files that
already exist locally, so it's safely resumable. Threads work because the TTS
call is network-bound and ffmpeg runs as a subprocess (both release the GIL).
Each worker uses its own temp dir to avoid silence-file name collisions.

  WORKERS=6 python3 scripts/_bulk_par.py
"""
import os, sys, json, tempfile, threading
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.path.insert(0, str(Path(__file__).parent))
import generate_audio_gemini as g

WORKERS = int(os.environ.get("WORKERS", "6"))
SECTIONS = ("verbs", "grammarPoints", "expressions", "vocabulary")
_print_lock = threading.Lock()


def log(msg):
    with _print_lock:
        print(msg, flush=True)


def in_scope(book_id, lesson_id):
    if book_id == 1:
        return lesson_id >= 6
    return book_id in (2, 3)


def needs(path: Path):
    return not (path.exists() and path.stat().st_size > 0)


def build_units():
    data = json.loads(g.BOOKS_JSON.read_text())
    base = g.LESSONS_OUT
    units = []
    for book in data["books"]:
        bid = book["id"]
        if bid not in (1, 2, 3):
            continue
        for lesson in book["lessons"]:
            lid = lesson["id"]
            if not in_scope(bid, lid):
                continue
            for sk in SECTIONS:
                items = lesson.get(sk) or []
                if items and needs(base / str(bid) / str(lid) / g.SECTION_OUTPUT[sk]):
                    units.append(("drill", bid, lid, sk, items))
            if lesson.get("readingText") and lid >= 4:
                if needs(base / str(bid) / str(lid) / "reading.mp3"):
                    units.append(("reading", bid, lid, None, lesson["readingText"]))
    return units


_stop = threading.Event()  # set once all TTS quota is exhausted


def do_unit(unit):
    if _stop.is_set():          # quota already gone — skip without touching the API
        return "__skipped__"
    kind, bid, lid, sk, payload = unit
    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        if kind == "drill":
            g.generate_drill(bid, lid, sk, payload, tmp_dir)
            return f"b{bid} l{lid} {sk}"
        else:
            g.generate_reading(bid, lid, payload, tmp_dir)
            return f"b{bid} l{lid} reading"


def main():
    g.get_client()  # warm the shared client once before fanning out
    units = build_units()
    total = len(units)
    log(f"Parallel run: {total} files across {WORKERS} workers")
    done = fail = skipped = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futs = {ex.submit(do_unit, u): u for u in units}
        for fut in as_completed(futs):
            u = futs[fut]
            try:
                name = fut.result()
                if name == "__skipped__":
                    skipped += 1
                    continue
                done += 1
                log(f"[{done+fail}/{total}] OK {name}")
            except g.AllQuotaExhausted as e:
                # No lane can serve requests anymore. Stop scheduling new work;
                # in-flight units will finish or skip. Resume tomorrow / once a
                # token is funded — the driver skips files that already exist.
                if not _stop.is_set():
                    log(f"\n⛔ {e}\n   Stopping; {total - done - fail - skipped} files left for next run.")
                _stop.set()
                fail += 1
            except Exception as e:
                fail += 1
                log(f"[{done+fail}/{total}] FAIL b{u[1]} l{u[2]} {u[3]}: {repr(e)[:160]}")
    log(f"\nDONE. ok={done} fail={fail} skipped={skipped} total={total}")


if __name__ == "__main__":
    main()
