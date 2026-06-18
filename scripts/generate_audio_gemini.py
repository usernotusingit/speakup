#!/usr/bin/env python3
"""
Generate MP3 audio files for Speakup using Google Gemini TTS.

Higher-quality alternative to generate_audio.py (Piper). Same modes, same data
files, same output tree — only the speech engine differs. Gemini returns raw PCM
(24 kHz, 16-bit, mono); we wrap it in WAV, then ffmpeg pads with silence and
concatenates to MP3 exactly as the Piper version does.

Setup:
  pip install google-genai
  export GEMINI_API_KEY="your_key"        # or GOOGLE_API_KEY
  (ffmpeg is still required for silence + MP3 muxing)

Mode 1 — Listening dialogues (full conversations):
  python3 scripts/generate_audio_gemini.py listenings          # all
  python3 scripts/generate_audio_gemini.py listenings 1 3      # specific IDs
  Output: public/audio/listenings/{id}.mp3

Mode 2 — Lesson section drills (verbs / grammar / expressions):
  python3 scripts/generate_audio_gemini.py drills              # all lessons
  python3 scripts/generate_audio_gemini.py drills 1 3          # specific lesson IDs
  Output: public/audio/lessons/{bookId}/{lessonId}/verbs.mp3   (etc.)

Drill format: Tom (EN) → 2s pause → next item
"""

import json
import os
import sys
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).parent.parent
LISTENINGS_JSON = REPO_ROOT / "src/data/listenings.json"
BOOKS_JSON = REPO_ROOT / "src/data/books.json"
LISTENINGS_OUT = REPO_ROOT / "public/audio/listenings"
LESSONS_OUT = REPO_ROOT / "public/audio/lessons"

# Gemini TTS settings
MODEL = "gemini-3.1-flash-tts-preview"
TEMPERATURE = 1.0
RETRIES = 4  # retries per clip on rate-limit / transient errors

# Speaker voice mapping. Gemini prebuilt voice names (was Piper .onnx models).
VOICES = {
    "female": "Kore",   # Ana, Joanne
    "male":   "Puck",   # Tom, Mike
}

SPEAKER_GENDER = {
    "Ana":    "female",
    "Joanne": "female",
    "Tom":    "male",
    "Mike":   "male",
}

# Audio format emitted by Gemini TTS (do not change unless the API changes)
SAMPLE_RATE = 24_000
CHANNELS = 1
SAMPLE_WIDTH = 2  # 16-bit

SILENCE_BETWEEN_TURNS = 0.5   # seconds between dialogue lines
SILENCE_PT_EN        = 1.5    # seconds between PT and EN in a drill item
SILENCE_BETWEEN_ITEMS = 2.0   # seconds between drill items
SILENCE_LEAD          = 0.5   # leading silence before first item

# Errors worth retrying (rate limits / transient server issues)
RETRYABLE = ("429", "RESOURCE_EXHAUSTED", "500", "503", "UNAVAILABLE", "deadline")

# ── Shared helpers ────────────────────────────────────────────────────────────

# Env var names checked, in order, for the Gemini API token.
API_KEY_VARS = ("GEMINI_API_KEY", "GOOGLE_API_KEY", "GOOGLE_GEMINI_ACCESS_TOKEN")


def get_api_key() -> str:
    """Resolve the API token from the environment. Never hardcode it."""
    for var in API_KEY_VARS:
        key = os.environ.get(var)
        if key:
            return key
    sys.exit(f"ERROR: set one of {', '.join(API_KEY_VARS)} in your environment.")


_client = None


def get_client():
    """Lazily create a single Gemini client (imported here so check_deps can
    give a friendly message if the package is missing)."""
    global _client
    if _client is None:
        from google import genai
        _client = genai.Client(api_key=get_api_key())
    return _client


def check_deps():
    missing = []
    if not shutil.which("ffmpeg"):
        missing.append("ffmpeg")
    try:
        import google.genai  # noqa: F401
    except ImportError:
        missing.append("google-genai (pip install google-genai)")
    if not any(os.environ.get(v) for v in API_KEY_VARS):
        missing.append(f"API token env var (one of: {', '.join(API_KEY_VARS)})")
    if missing:
        print("Missing dependencies:")
        for m in missing:
            print(f"  • {m}")
        sys.exit(1)


def normalize_text(text: str) -> str:
    return text.replace(" / ", ", ").replace("!", ".")


def _is_retryable(err: Exception) -> bool:
    msg = str(err).lower()
    return any(tok.lower() in msg for tok in RETRYABLE)


def write_wav(path: Path, pcm: bytes):
    import wave
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm)


def synthesize(text: str, gender: str, output_wav: Path):
    """Synthesize one line with Gemini and write it to output_wav (24 kHz WAV).

    Drop-in replacement for the Piper version: same signature, same output file,
    plus retry/backoff since this is a rate-limited cloud API.
    """
    from google.genai import types

    client = get_client()
    config = types.GenerateContentConfig(
        temperature=TEMPERATURE,
        response_modalities=["AUDIO"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                    voice_name=VOICES[gender]
                )
            )
        ),
    )

    delay = 2.0
    for attempt in range(1, RETRIES + 2):  # initial try + RETRIES retries
        try:
            resp = client.models.generate_content(
                model=MODEL, contents=text, config=config
            )
            pcm = resp.candidates[0].content.parts[0].inline_data.data
            if not pcm:
                raise RuntimeError("empty audio payload")
            write_wav(output_wav, pcm)
            return
        except Exception as err:
            if attempt <= RETRIES and _is_retryable(err):
                time.sleep(delay)
                delay = min(delay * 2, 30)  # exponential backoff, capped
                continue
            raise RuntimeError(f"Gemini TTS failed for '{text[:40]}': {err}") from err


def make_silence(duration: float, output_wav: Path, sample_rate: int = SAMPLE_RATE):
    cmd = [
        "ffmpeg", "-y", "-f", "lavfi",
        "-i", f"anullsrc=r={sample_rate}:cl=mono",
        "-t", str(duration), str(output_wav),
    ]
    subprocess.run(cmd, capture_output=True, check=True)


def concat_to_mp3(wav_files: list, output_mp3: Path):
    list_file = output_mp3.with_suffix(".txt")
    list_file.write_text("\n".join(f"file '{p}'" for p in wav_files))
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", str(list_file),
        "-ar", str(SAMPLE_RATE), "-ac", "1",
        "-codec:a", "libmp3lame", "-q:a", "4",
        str(output_mp3),
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    list_file.unlink()

# ── Mode 1: Listening dialogues ───────────────────────────────────────────────

def generate_listening(listening: dict, tmp_dir: Path):
    lid = listening["id"]
    output_mp3 = LISTENINGS_OUT / f"{lid}.mp3"
    print(f"\n[Listening {lid}] {listening['title']}")

    silence_wav = tmp_dir / "turn_silence.wav"
    make_silence(SILENCE_BETWEEN_TURNS, silence_wav)

    wav_files = []
    for i, turn in enumerate(listening["dialogue"]):
        speaker = turn["speaker"]
        line = turn["line"]
        gender = SPEAKER_GENDER.get(speaker, "female")
        line_wav = tmp_dir / f"l{lid}_line_{i:03d}.wav"
        print(f"  {speaker}: {line[:70]}{'…' if len(line) > 70 else ''}")
        synthesize(line, gender, line_wav)
        wav_files.append(line_wav)
        if i < len(listening["dialogue"]) - 1:
            wav_files.append(silence_wav)

    LISTENINGS_OUT.mkdir(parents=True, exist_ok=True)
    concat_to_mp3(wav_files, output_mp3)
    print(f"  ✓ {output_mp3.relative_to(REPO_ROOT)} ({output_mp3.stat().st_size // 1024} KB)")


def run_listenings(ids: set):
    data = json.loads(LISTENINGS_JSON.read_text())
    items = data["listenings"]
    if ids:
        items = [l for l in items if l["id"] in ids]
    print(f"Generating {len(items)} listening(s)...")
    with tempfile.TemporaryDirectory() as tmp:
        for item in items:
            generate_listening(item, Path(tmp))

# ── Mode 2: Lesson section drills ────────────────────────────────────────────

SECTION_OUTPUT = {
    "verbs":         "verbs.mp3",
    "grammarPoints": "grammar.mp3",
    "expressions":   "expressions.mp3",
    "vocabulary":    "vocabulary.mp3",
}


def generate_drill(book_id: int, lesson_id: int, section_key: str, items: list, tmp_dir: Path):
    if not items:
        return

    out_dir = LESSONS_OUT / str(book_id) / str(lesson_id)
    out_dir.mkdir(parents=True, exist_ok=True)
    output_mp3 = out_dir / SECTION_OUTPUT[section_key]

    silence_lead  = tmp_dir / "sil_lead.wav"
    silence_items = tmp_dir / "sil_items.wav"
    make_silence(SILENCE_LEAD, silence_lead)
    make_silence(SILENCE_BETWEEN_ITEMS, silence_items)

    wav_files = [silence_lead]
    for i, item in enumerate(items):
        en_text = item.get("en", "")
        en_wav = tmp_dir / f"b{book_id}_l{lesson_id}_{section_key}_{i:03d}_en.wav"

        print(f"    [{i+1}/{len(items)}] {en_text[:60]}{'…' if len(en_text) > 60 else ''}")
        synthesize(normalize_text(en_text), "male", en_wav)

        wav_files.append(en_wav)
        if i < len(items) - 1:
            wav_files.append(silence_items)

    concat_to_mp3(wav_files, output_mp3)
    print(f"  ✓ {output_mp3.relative_to(REPO_ROOT)} ({output_mp3.stat().st_size // 1024} KB)")


def generate_reading(book_id: int, lesson_id: int, reading: dict, tmp_dir: Path):
    out_dir = LESSONS_OUT / str(book_id) / str(lesson_id)
    out_dir.mkdir(parents=True, exist_ok=True)
    output_mp3 = out_dir / "reading.mp3"

    body = normalize_text(reading["body"])
    body_wav = tmp_dir / f"b{book_id}_l{lesson_id}_reading.wav"
    lead_wav = tmp_dir / "sil_lead.wav"
    make_silence(SILENCE_LEAD, lead_wav)

    print(f"  → reading ({len(body)} chars)")
    synthesize(body, "male", body_wav)
    concat_to_mp3([lead_wav, body_wav], output_mp3)
    print(f"  ✓ {output_mp3.relative_to(REPO_ROOT)} ({output_mp3.stat().st_size // 1024} KB)")


def run_drills(ids: set):
    data = json.loads(BOOKS_JSON.read_text())
    print(f"Generating drills...")
    with tempfile.TemporaryDirectory() as tmp:
        tmp_dir = Path(tmp)
        for book in data["books"]:
            bid = book["id"]
            for lesson in book["lessons"]:
                lid = lesson["id"]
                if ids and lid not in ids:
                    continue
                print(f"\n[Book {bid} / Lesson {lid}] {lesson['title']}")
                for section_key in ("verbs", "grammarPoints", "expressions", "vocabulary"):
                    items = lesson.get(section_key, [])
                    if items:
                        print(f"  → {section_key} ({len(items)} items)")
                        generate_drill(bid, lid, section_key, items, tmp_dir)
                if lesson.get("readingText") and lid >= 4:
                    generate_reading(bid, lid, lesson["readingText"], tmp_dir)

# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    check_deps()

    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(0)

    mode = args[0]
    ids = set(int(x) for x in args[1:]) if len(args) > 1 else set()

    if mode == "listenings":
        run_listenings(ids)
    elif mode == "drills":
        run_drills(ids)
    else:
        print(f"Unknown mode: {mode}. Use 'listenings' or 'drills'.")
        sys.exit(1)

    print("\nAll done.")


if __name__ == "__main__":
    main()
