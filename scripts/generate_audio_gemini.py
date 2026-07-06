#!/usr/bin/env python3
"""
Generate MP3 audio files for Speakup using Google Gemini TTS.

Higher-quality alternative to generate_audio.py (Piper). Same modes, same data
files, same output tree — only the speech engine differs. Gemini returns raw PCM
(24 kHz, 16-bit, mono); we wrap it in WAV, then ffmpeg pads with silence and
concatenates to MP3 exactly as the Piper version does.

Setup:
  pip install google-genai
  export GOOGLE_GEMINI_ACCESS_TOKEN="your_key"   # or GOOGLE_GEMINI_ACCESS_TOKEN_2
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
import threading
import time
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).parent.parent
LISTENINGS_JSON = REPO_ROOT / "src/data/listenings.json"
BOOKS_JSON = REPO_ROOT / "src/data/books.json"
LISTENINGS_OUT = REPO_ROOT / "public/audio/listenings"
LESSONS_OUT = REPO_ROOT / "public/audio/lessons"

# Gemini TTS settings
#
# Every preview TTS model is hard-capped at 100 requests/day PER PROJECT PER
# MODEL, and Tier-1 billing does NOT raise it (only large cumulative spend or a
# manual quota grant does). We get around it by rotating over "lanes" = every
# (token × model) pair, since each pair is an independent 100/day bucket. See
# LaneManager below. TTS_MODELS is listed cheapest/fastest first (flash before
# pro) so the pricey pro model is only used once the flash buckets are spent.
TTS_MODELS = (
    "gemini-2.5-flash-preview-tts",
    "gemini-3.1-flash-tts-preview",
    "gemini-2.5-pro-preview-tts",
)
MODEL = TTS_MODELS[0]  # default / single-model fallback
TEMPERATURE = 1.0
RETRIES = 4        # soft retries per clip on rate-limit / transient errors
EMPTY_RETRIES = 6  # extra retries when the model returns no audio (short inputs)

# Global requests/minute ceiling. Kept conservative so it's safe for every model
# in the pool (pro's RPM is lower than flash's). The binding limit on total
# output is the per-lane 100/day cap, not RPM, so a low RPM costs little.
RPM_LIMIT = 5

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
# The secondary account token is preferred when present.
API_KEY_VARS = (
    "GOOGLE_GEMINI_ACCESS_TOKEN_2",
    "GOOGLE_GEMINI_ACCESS_TOKEN",
)


class AllQuotaExhausted(RuntimeError):
    """Raised when every (token × model) lane is spent for the day or dead."""


class _Lane:
    __slots__ = ("key_var", "model", "client")

    def __init__(self, key_var, model):
        self.key_var = key_var
        self.model = model
        self.client = None  # created lazily on first use

    def label(self):
        return f"{self.key_var}×{self.model}"


class LaneManager:
    """Pool of (token × model) lanes, each an independent 100/day quota bucket.

    acquire() hands out the highest-priority lane that is still usable. A lane is
    retired two ways: mark_exhausted(lane) when it hits its per-DAY cap (skipped
    for the rest of this process), and mark_dead(key_var) when a token reports
    depleted prepayment credits (skips all that token's lanes). When nothing is
    left, acquire() raises AllQuotaExhausted so the run stops cleanly and resumes
    next day. Thread-safe: all state changes happen under a single lock.
    """

    def __init__(self, key_vars=API_KEY_VARS, models=TTS_MODELS):
        from google import genai
        self._genai = genai
        self.lanes = [
            _Lane(kv, m) for kv in key_vars if os.environ.get(kv) for m in models
        ]
        if not self.lanes:
            sys.exit(f"ERROR: set one of {', '.join(key_vars)} in your environment.")
        self._lock = threading.Lock()
        self._exhausted = set()   # lane indices past their daily cap
        self._dead_keys = set()   # key_vars with depleted credits

    def _client(self, lane):
        if lane.client is None:
            lane.client = self._genai.Client(api_key=os.environ[lane.key_var])
        return lane.client

    def acquire(self):
        """Return (index, lane, client) for the best usable lane, else raise."""
        with self._lock:
            for i, lane in enumerate(self.lanes):
                if i in self._exhausted or lane.key_var in self._dead_keys:
                    continue
                return i, lane, self._client(lane)
        raise AllQuotaExhausted(
            "all TTS quota exhausted (every token × model lane spent or unfunded)"
        )

    def mark_exhausted(self, index, lane):
        with self._lock:
            if index not in self._exhausted:
                self._exhausted.add(index)
                print(f"  ⚠ lane exhausted for the day: {lane.label()}", flush=True)

    def mark_dead(self, lane):
        with self._lock:
            if lane.key_var not in self._dead_keys:
                self._dead_keys.add(lane.key_var)
                print(f"  ⚠ token unfunded (credits depleted): {lane.key_var}", flush=True)


_pool = None


def get_pool() -> "LaneManager":
    """Lazily build the shared lane pool (imported here so check_deps can give a
    friendly message if google-genai is missing)."""
    global _pool
    if _pool is None:
        _pool = LaneManager()
    return _pool


# Back-compat: some callers (e.g. _bulk_par.py) warm the client before fanning
# out. Warming the pool is the equivalent now.
def get_client():
    return get_pool()


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


# ── Global rate limiter ───────────────────────────────────────────────────────
# The model caps requests-per-minute (not per-day). Every API call — including
# retries, and across all worker threads — must pass through _rate_limit(), which
# hands each caller a time slot spaced 60/RPM_LIMIT seconds apart and sleeps it
# until then. Thread-safe: the slot is claimed under a lock, the wait happens
# outside it so threads queue rather than block each other.
_MIN_INTERVAL = 60.0 / RPM_LIMIT
_rate_lock = threading.Lock()
_next_slot = [0.0]


def _rate_limit():
    with _rate_lock:
        now = time.monotonic()
        slot = max(now, _next_slot[0])
        _next_slot[0] = slot + _MIN_INTERVAL
    wait = slot - time.monotonic()
    if wait > 0:
        time.sleep(wait)


def write_wav(path: Path, pcm: bytes):
    import wave
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(SAMPLE_WIDTH)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(pcm)


def _is_daily_cap(msg: str) -> bool:
    """True if the error is the per-day request cap (rotate to another lane)."""
    return "per_model_per_day" in msg or "requests_per_day" in msg


def _is_credits_depleted(msg: str) -> bool:
    """True if the token's prepayment balance is spent (retire the whole token)."""
    return "credits are depleted" in msg or "prepayment credits" in msg


def synthesize(text: str, gender: str, output_wav: Path):
    """Synthesize one line with Gemini and write it to output_wav (24 kHz WAV).

    Same signature/output as the Piper version. Rotates across (token × model)
    lanes on daily-cap / depleted-credit 429s, and does bounded backoff retries
    for per-minute limits, transient 5xx, and intermittent empty-audio responses.
    Raises AllQuotaExhausted when no lane can serve the request.
    """
    from google.genai import types

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

    pool = get_pool()
    delay = 2.0
    soft_attempts = 0   # bounded retries for per-minute limits / transient 5xx
    empty_attempts = 0  # separate, larger budget for empty-audio responses
    spoken = text       # may get a trailing period added as a reliability nudge
    while True:
        # acquire() raises AllQuotaExhausted (propagated) once no lane is left.
        idx, lane, client = pool.acquire()
        try:
            _rate_limit()  # global RPM throttle (across threads + retries)
            resp = client.models.generate_content(
                model=lane.model, contents=spoken, config=config
            )
            # Gemini intermittently returns a candidate with no audio parts
            # (finish_reason OTHER), especially for short inputs like single
            # vocab words — and more often on the pro model. Retry with a bigger
            # budget, and nudge with a trailing period (empirically more reliable
            # than a bare word) rather than crashing on a NoneType access.
            cand = resp.candidates[0] if resp.candidates else None
            parts = cand.content.parts if (cand and cand.content and cand.content.parts) else None
            pcm = parts[0].inline_data.data if parts else None
            if not pcm:
                empty_attempts += 1
                if empty_attempts > EMPTY_RETRIES:
                    fr = getattr(cand, "finish_reason", None)
                    raise RuntimeError(f"persistently empty audio (finish={fr})")
                if not spoken.rstrip().endswith((".", "?", "!")):
                    spoken = spoken.rstrip() + "."   # add period after first miss
                time.sleep(0.5)
                continue
            write_wav(output_wav, pcm)
            return
        except AllQuotaExhausted:
            raise
        except Exception as err:
            msg = str(err).lower()
            # Quota rotations — retire the lane/token and try the next one. These
            # are not bounded retries (no point limiting them).
            if _is_credits_depleted(msg):
                pool.mark_dead(lane)
                continue
            if _is_daily_cap(msg):
                pool.mark_exhausted(idx, lane)
                continue
            # Per-minute limits / transient 5xx — back off in place.
            if _is_retryable(err) and soft_attempts < RETRIES:
                soft_attempts += 1
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
    rendered = skipped = 0
    for i, item in enumerate(items):
        en_text = item.get("en", "")
        en_wav = tmp_dir / f"b{book_id}_l{lesson_id}_{section_key}_{i:03d}_en.wav"

        print(f"    [{i+1}/{len(items)}] {en_text[:60]}{'…' if len(en_text) > 60 else ''}")
        try:
            synthesize(normalize_text(en_text), "male", en_wav)
        except AllQuotaExhausted:
            raise  # no quota left anywhere — let the driver stop the whole run
        except Exception as err:
            # One item failing (e.g. persistently-empty short word) must not
            # discard the whole file — skip it and keep the rest.
            skipped += 1
            print(f"      ⤷ skipped item {i+1} ('{en_text[:30]}'): {err}", flush=True)
            continue

        wav_files.append(en_wav)
        wav_files.append(silence_items)
        rendered += 1

    if rendered == 0:
        raise RuntimeError(f"no items rendered for b{book_id} l{lesson_id} {section_key}")
    concat_to_mp3(wav_files, output_mp3)
    note = f" ({skipped} item(s) skipped)" if skipped else ""
    print(f"  ✓ {output_mp3.relative_to(REPO_ROOT)} ({output_mp3.stat().st_size // 1024} KB){note}")


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
