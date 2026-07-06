#!/usr/bin/env python3
"""Driver: generate books 1-3 drills/readings, skipping files that already
exist locally. Scope: book1 lessons 6-36, all of book2, all of book3.
Set DRY=1 to count without calling the API."""
import os, sys, json, tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import generate_audio_gemini as g

DRY = os.environ.get("DRY") == "1"
SECTIONS = ("verbs", "grammarPoints", "expressions", "vocabulary")


def in_scope(book_id, lesson_id):
    if book_id == 1:
        return lesson_id >= 6
    return book_id in (2, 3)


def needs(path: Path):
    return not (path.exists() and path.stat().st_size > 0)


def main():
    data = json.loads(g.BOOKS_JSON.read_text())
    base = g.LESSONS_OUT
    gen = skip = 0
    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
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
                    if not items:
                        continue
                    out = base / str(bid) / str(lid) / g.SECTION_OUTPUT[sk]
                    if not needs(out):
                        skip += 1
                        continue
                    gen += 1
                    if DRY:
                        print(f"[would gen] b{bid} l{lid} {sk} ({len(items)} items)")
                    else:
                        print(f"=== b{bid} l{lid} {sk} ===", flush=True)
                        g.generate_drill(bid, lid, sk, items, tmp_dir)
                if lesson.get("readingText") and lid >= 4:
                    out = base / str(bid) / str(lid) / "reading.mp3"
                    if needs(out):
                        gen += 1
                        if DRY:
                            print(f"[would gen] b{bid} l{lid} reading")
                        else:
                            print(f"=== b{bid} l{lid} reading ===", flush=True)
                            g.generate_reading(bid, lid, lesson["readingText"], tmp_dir)
                    else:
                        skip += 1
    print(f"\nDONE. files_to_generate={gen} skipped_existing={skip}")


if __name__ == "__main__":
    main()
