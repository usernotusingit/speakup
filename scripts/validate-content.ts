/**
 * Content validator for the lesson data files.
 *
 * Checks the invariants the app relies on so a malformed lesson can never ship:
 *   - every lesson has the required student-facing fields
 *   - quiz eligibility is intentional (a content lesson always has enough
 *     vocabulary/grammar for the auto-generated quiz; reading lessons opt out
 *     by having no verbs)
 *   - ids are unique and contiguous per book
 *   - every lesson has a paired teacher-only practice entry
 *
 * Run:  npx tsx scripts/validate-content.ts
 * Exits non-zero if any error is found (warnings do not fail the build).
 */
import books from "../src/data/books.json";
import practice from "../src/data/books-practice.json";

type Pair = { en: string; pt: string };

const errors: string[] = [];
const warnings: string[] = [];

const isPair = (x: unknown): x is Pair =>
  !!x &&
  typeof (x as Pair).en === "string" &&
  typeof (x as Pair).pt === "string";

function checkPairs(where: string, arr: unknown) {
  if (!Array.isArray(arr)) {
    errors.push(`${where}: expected an array`);
    return;
  }
  arr.forEach((p, i) => {
    if (!isPair(p)) {
      errors.push(`${where}[${i}]: not an {en, pt} pair`);
    } else if (!p.en.trim() || !p.pt.trim()) {
      errors.push(`${where}[${i}]: empty en or pt`);
    }
  });
}

for (const book of books.books) {
  const seen = new Set<number>();
  book.lessons.forEach((lesson: any, idx: number) => {
    const where = `Book ${book.id} / Lesson ${lesson.id}`;

    // ids unique + contiguous from 1
    if (seen.has(lesson.id)) errors.push(`${where}: duplicate lesson id`);
    seen.add(lesson.id);
    if (lesson.id !== idx + 1)
      errors.push(`${where}: id should be ${idx + 1} (lessons must be contiguous)`);

    // required scalar fields
    for (const f of ["title", "curiosity", "teachingGuide"]) {
      if (typeof lesson[f] !== "string" || !lesson[f].trim())
        errors.push(`${where}: missing/empty "${f}"`);
    }

    // required pair arrays
    checkPairs(`${where}.verbs`, lesson.verbs);
    checkPairs(`${where}.grammarPoints`, lesson.grammarPoints);
    checkPairs(`${where}.vocabulary`, lesson.vocabulary);
    checkPairs(`${where}.expressions`, lesson.expressions);

    // grammar threshold (quiz needs >= 3)
    if ((lesson.grammarPoints?.length ?? 0) < 3)
      errors.push(`${where}: needs >= 3 grammarPoints (has ${lesson.grammarPoints?.length ?? 0})`);

    // quiz eligibility must be intentional
    const vocabCount = lesson.vocabulary?.length ?? 0;
    const isReading = (lesson.verbs?.length ?? 0) === 0;
    if (!isReading && vocabCount < 10)
      warnings.push(`${where}: content lesson has only ${vocabCount} vocabulary — quiz will show "not ready" (need >= 10)`);

    // optional reading block
    if (lesson.readingText) {
      const rt = lesson.readingText;
      if (typeof rt.title !== "string" || typeof rt.body !== "string")
        errors.push(`${where}.readingText: needs string title and body`);
      if (rt.glossary) checkPairs(`${where}.readingText.glossary`, rt.glossary);
    }

    // optional homework
    if (lesson.homework !== undefined) {
      if (!Array.isArray(lesson.homework) || lesson.homework.some((h: unknown) => typeof h !== "string"))
        errors.push(`${where}.homework: must be an array of strings`);
    }

    // paired teacher practice entry
    const pe = practice.practice.find(
      (p) => p.bookId === book.id && p.lessonId === lesson.id
    );
    if (!pe) {
      errors.push(`${where}: no matching practice entry in books-practice.json`);
    } else {
      for (const f of ["practiceVerbs", "practiceVocabulary", "practiceExpressions"]) {
        if ((pe as any)[f] !== undefined) checkPairs(`${where}.${f}`, (pe as any)[f]);
      }
      // practicingPart2 must be {en,pt} pairs to render; the placeholder
      // Books 2-5 still hold the legacy plain-string format (renders empty in
      // the teacher view) — flag as debt to fix when those books are authored.
      const p2 = (pe as any).practicingPart2;
      if (Array.isArray(p2)) {
        if (p2.every((x: unknown) => typeof x === "string")) {
          warnings.push(`${where}.practicingPart2: legacy string format (renders empty) — convert to {en, pt} pairs`);
        } else {
          checkPairs(`${where}.practicingPart2`, p2);
        }
      }
    }
  });

  // optional mid-term review (unnumbered, sits between lessons 18 and 19)
  const review = (book as any).midReview;
  if (review) {
    const where = `Book ${book.id} / midReview`;
    if (typeof review.title !== "string" || !review.title.trim())
      errors.push(`${where}: missing/empty "title"`);
    checkPairs(`${where}.grammarPoints`, review.grammarPoints);
    if ((review.grammarPoints?.length ?? 0) < 3)
      errors.push(`${where}: needs >= 3 grammarPoints (has ${review.grammarPoints?.length ?? 0})`);
    if (!Array.isArray(review.homework) || review.homework.some((h: unknown) => typeof h !== "string") || review.homework.length === 0)
      errors.push(`${where}.homework: must be a non-empty array of strings`);
  }
}

// practice entries with no matching lesson (orphans)
for (const pe of practice.practice) {
  const book = books.books.find((b) => b.id === pe.bookId);
  if (!book || !book.lessons.find((l: any) => l.id === pe.lessonId))
    errors.push(`Practice entry Book ${pe.bookId} / Lesson ${pe.lessonId}: no matching lesson`);
}

const totalLessons = books.books.reduce((n, b) => n + b.lessons.length, 0);
console.log(`Checked ${books.books.length} books, ${totalLessons} lessons, ${practice.practice.length} practice entries.`);

if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log(`  - ${w}`));
}

if (errors.length) {
  console.error(`\n❌ ${errors.length} error(s):`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log("\n✅ All content valid.");
