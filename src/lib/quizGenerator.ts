// ─── Types ────────────────────────────────────────────────────────────────────

export interface WordPair {
  en: string;
  pt: string;
}

export interface QuizLesson {
  id: number;
  title: string;
  verbs: WordPair[];
  grammarPoints: WordPair[];
  vocabulary: WordPair[];
  expressions: WordPair[];
  // "Practicing — Part II" sentences; primary source for word-order challenges.
  practicingPart2?: WordPair[];
}

export interface FlipCardsChallenge {
  type: "flipcards";
  label: string;
  cards: WordPair[];
}

export interface MultipleChoiceChallenge {
  type: "multiple-choice";
  question: string;
  options: string[];
  answer: number; // index into options
}

export interface FillBlankChallenge {
  type: "fill-blank";
  before: string;  // text before blank
  after: string;   // text after blank
  hint: string;    // Portuguese translation
  options: string[];
  answer: number;
}

export interface TrueFalseChallenge {
  type: "true-false";
  sentence: string;
  correct: boolean; // true = sentence IS correct English
  explanation: string;
}

export interface MatchingChallenge {
  type: "matching";
  pairs: WordPair[]; // left=PT, right=EN — right will be shuffled in component
}

export interface WordOrderChallenge {
  type: "word-order";
  words: string[];   // shuffled tiles
  answer: string;    // correct sentence (no trailing punctuation)
  hint: string;      // Portuguese
}

export type Challenge =
  | FlipCardsChallenge
  | MultipleChoiceChallenge
  | FillBlankChallenge
  | TrueFalseChallenge
  | MatchingChallenge
  | WordOrderChallenge;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}

export function makeOptions(
  pool: string[],
  correct: string
): { options: string[]; answer: number } {
  const distractors = shuffle(pool.filter((p) => p !== correct)).slice(0, 3);
  const all = shuffle([correct, ...distractors]);
  return { options: all, answer: all.indexOf(correct) };
}

export function cleanSentence(en: string): string | null {
  // Practice sentences carry "/ alternative" suffixes, e.g.
  // "My father and my sister speak English./ Portuguese". Keep the base clause
  // (before the first "/"), drop trailing punctuation, and require a
  // reorder-able, playable length.
  const base = en.split("/")[0].trim().replace(/[.!?,;:]+$/, "").trim();
  const words = base.split(/\s+/).filter(Boolean);
  if (words.length < 4 || words.length > 12) return null;
  return base;
}

export function verbBase(verbEn: string): string {
  // "to like, liked" → "like"
  return verbEn.replace(/^to\s+/i, "").split(",")[0].trim().toLowerCase();
}

export function findLastVerbInSentence(
  sentence: string,
  verbBases: string[]
): string | null {
  const words = sentence.toLowerCase().match(/\b\w+\b/g) ?? [];
  let lastVerb: string | null = null;
  for (const word of words) {
    if (verbBases.includes(word)) {
      lastVerb = word;
    }
  }
  return lastVerb;
}

export function introduceError(
  sentence: string,
  verbBases: string[]
): { wrong: string; explanation: string } | null {
  // Strategy 1: "don't X" → "don't Xs" (verb after don't shouldn't conjugate)
  const dontMatch = sentence.match(/\bdon't\s+(\w+)\b/i);
  if (dontMatch) {
    const verb = dontMatch[1].toLowerCase();
    if (verbBases.includes(verb)) {
      const wrong = sentence.replace(
        /\bdon't\s+(\w+)\b/i,
        `don't ${verb}s`
      );
      return {
        wrong,
        explanation: `After "don't", the verb does NOT get an "s". Correct: "${sentence}"`,
      };
    }
  }

  // Strategy 2: "like to drink" → "like drink" (missing "to" between verbs)
  const toVerbMatch = sentence.match(/\b(like|need|want|love)\s+to\s+(\w+)\b/i);
  if (toVerbMatch) {
    const wrong = sentence.replace(/\bto\s+(\w+)\b/i, toVerbMatch[2]);
    return {
      wrong,
      explanation: `When two verbs follow each other, use "to": "${toVerbMatch[1]} to ${toVerbMatch[2]}". Correct: "${sentence}"`,
    };
  }

  // Strategy 3: "I like" → "I likes" (wrong conjugation with I/You)
  const iSubjectMatch = sentence.match(/^(I|You)\s+(like|speak|drink|eat|work|need|play|study)\b/i);
  if (iSubjectMatch) {
    const subj = iSubjectMatch[1];
    const verb = iSubjectMatch[2];
    const wrong = sentence.replace(
      new RegExp(`^${subj}\\s+${verb}\\b`, "i"),
      `${subj} ${verb}s`
    );
    return {
      wrong,
      explanation: `With "${subj}", the verb does NOT get an "s". Correct: "${sentence}"`,
    };
  }

  // Strategy 4: "I like you" → "I like of you" (PT interference)
  if (/\blike\s+(you|him|her|us|them)\b/i.test(sentence)) {
    const wrong = sentence.replace(/\blike\s+(you|him|her|us|them)\b/i, (m, p) => `like of ${p}`);
    return {
      wrong,
      explanation: `In English we say "like you" — no preposition "of". Correct: "${sentence}"`,
    };
  }

  return null;
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildChallenges(lesson: QuizLesson): Challenge[] {
  const challenges: Challenge[] = [];

  const verbBases = lesson.verbs.map((v) => verbBase(v.en));
  const verbPtPool = lesson.verbs.map((v) => v.pt);
  const vocabPtPool = lesson.vocabulary.map((v) => v.pt);
  const vocabEnPool = lesson.vocabulary.map((v) => v.en);
  const exprPtPool = lesson.expressions.map((e) => e.pt);
  const exprEnPool = lesson.expressions.map((e) => e.en);

  // Shuffle vocab for batching (used by the vocab matching challenge below)
  const vocabShuffled = shuffle(lesson.vocabulary);
  const vocabBatch1 = vocabShuffled.slice(0, 8);

  // 2. MultipleChoice × 2 — two verbs: EN → PT
  for (const verb of pick(lesson.verbs, 2)) {
    const { options, answer } = makeOptions(verbPtPool, verb.pt);
    challenges.push({
      type: "multiple-choice",
      question: `What does "${verb.en}" mean in Portuguese?`,
      options,
      answer,
    });
  }

  // 3. TrueFalse × up to 2 — alternating correct/incorrect
  const trueFalseChallenges: TrueFalseChallenge[] = [];
  for (const gp of lesson.grammarPoints) {
    if (trueFalseChallenges.length >= 2) break;
    const sentence = gp.en.trim();

    // Alternate: even idx = correct, odd = incorrect
    if (trueFalseChallenges.length % 2 === 0) {
      trueFalseChallenges.push({
        type: "true-false",
        sentence,
        correct: true,
        explanation: `Correct! "${sentence}" is proper English.`,
      });
    } else {
      const errorResult = introduceError(sentence, verbBases);
      if (errorResult) {
        trueFalseChallenges.push({
          type: "true-false",
          sentence: errorResult.wrong,
          correct: false,
          explanation: errorResult.explanation,
        });
      } else {
        // fallback to a correct one
        trueFalseChallenges.push({
          type: "true-false",
          sentence,
          correct: true,
          explanation: `Correct! "${sentence}" is proper English.`,
        });
      }
    }
  }
  challenges.push(...trueFalseChallenges);

  // 4. MultipleChoice × 1 — vocab EN→PT
  const vocabForMC1 = pick(lesson.vocabulary, 1);
  for (const v of vocabForMC1) {
    const { options, answer } = makeOptions(vocabPtPool, v.pt);
    challenges.push({
      type: "multiple-choice",
      question: `What does "${v.en}" mean in Portuguese?`,
      options,
      answer,
    });
  }

  // 6. FillBlank × up to 2 — from grammar points
  const fillBlanks: FillBlankChallenge[] = [];
  for (const gp of lesson.grammarPoints) {
    if (fillBlanks.length >= 2) break;
    const s = gp.en.trim();
    // Skip compound or complex sentences
    if (s.includes("—") || s.includes("(") || s.includes(",")) continue;
    const stripped = s.replace(/[.!?]$/, "");
    const words = stripped.split(" ");
    if (words.length < 3) continue;

    const lastVerb = findLastVerbInSentence(stripped, verbBases);
    if (!lastVerb) continue;

    // Find position of last occurrence
    const wordLower = words.map((w) => w.toLowerCase());
    let blankIdx = -1;
    for (let i = words.length - 1; i >= 0; i--) {
      if (wordLower[i] === lastVerb) {
        blankIdx = i;
        break;
      }
    }
    if (blankIdx === -1) continue;

    const before = words.slice(0, blankIdx).join(" ");
    const after = words.slice(blankIdx + 1).join(" ") + (s.match(/[.!?]$/) ? s.slice(-1) : "");
    const { options, answer } = makeOptions(verbBases, lastVerb);

    fillBlanks.push({
      type: "fill-blank",
      before,
      after,
      hint: gp.pt,
      options,
      answer,
    });
  }
  challenges.push(...fillBlanks);

  // 7. Matching × 1 — 5 vocab pairs (batch 1)
  const matchVocab1 = pick(vocabBatch1, 5);
  if (matchVocab1.length >= 2) {
    challenges.push({
      type: "matching",
      pairs: matchVocab1.map((v) => ({ en: v.en, pt: v.pt })),
    });
  }

  // 8. MultipleChoice × 1 — vocab PT→EN
  const vocabForMC2 = pick(lesson.vocabulary, 1);
  for (const v of vocabForMC2) {
    const { options, answer } = makeOptions(vocabEnPool, v.en);
    challenges.push({
      type: "multiple-choice",
      question: `"${v.pt}" in English is:`,
      options,
      answer,
    });
  }

  // 11. MultipleChoice × 1 — expression EN→PT
  const exprsForMC = pick(lesson.expressions, 1);
  for (const e of exprsForMC) {
    const { options, answer } = makeOptions(exprPtPool, e.pt);
    challenges.push({
      type: "multiple-choice",
      question: `What does "${e.en}" mean in Portuguese?`,
      options,
      answer,
    });
  }

  // 12. Matching × 1 — 5 expression pairs
  const matchExprs = pick(lesson.expressions, 5);
  if (matchExprs.length >= 2) {
    challenges.push({
      type: "matching",
      pairs: matchExprs.map((e) => ({ en: e.en, pt: e.pt })),
    });
  }

  // 13. WordOrder × up to 4 — reassemble full sentences. This absorbs the two
  //     slots previously held by the flip-card decks. Primary source is the
  //     "Practicing — Part II" sentences (they cover all of the lesson's key
  //     content); grammar-point sentences are a fallback so the count still
  //     holds for lessons without Part II data (e.g. books 4–5).
  const woPool: { answer: string; hint: string; nice: boolean }[] = [];
  const woSeen = new Set<string>();
  const addWordOrder = (en: unknown, pt: unknown) => {
    if (typeof en !== "string" || typeof pt !== "string") return;
    const answer = cleanSentence(en);
    if (!answer) return;
    const key = answer.toLowerCase();
    if (woSeen.has(key)) return;
    woSeen.add(key);
    // "Nice" = a short, single-clause sentence — makes for clean, playable tiles.
    const nice = answer.split(/\s+/).length <= 9 && !/[,;:—–()]/.test(answer);
    woPool.push({ answer, hint: pt.split("/")[0].trim(), nice });
  };
  for (const s of shuffle(lesson.practicingPart2 ?? [])) addWordOrder(s?.en, s?.pt);
  for (const gp of shuffle(lesson.grammarPoints)) addWordOrder(gp.en, gp.pt);

  // Prefer the clean sentences; fall back to longer/compound ones only to fill
  // the 4 slots, so the count holds even for content-heavy B1 lessons.
  const woOrdered = [...woPool.filter((w) => w.nice), ...woPool.filter((w) => !w.nice)];
  for (const { answer, hint } of woOrdered.slice(0, 4)) {
    challenges.push({
      type: "word-order",
      words: shuffle(answer.split(/\s+/)),
      answer,
      hint,
    });
  }

  return challenges;
}
