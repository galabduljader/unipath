// Study-kit generators. `quickKit` builds slides + suggested questions straight
// from the notebook's source text — no backend needed — so the slides / audio /
// video features work immediately; an AI pass (ai.ts) can produce a richer kit
// once the study function is deployed.

import type { Slide, StudyKit, StudyNotebook } from "@/lib/study/store";

function splitSentences(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split(/(?<=[.!?؟])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function titleFrom(sentence: string): string {
  const words = sentence.replace(/^[\s\-•*·]+/, "").split(/\s+/).slice(0, 6).join(" ");
  const t = words.replace(/[.,;:؛،]$/, "");
  const capped = t.length > 48 ? t.slice(0, 48).trim() + "…" : t;
  return capped.charAt(0).toUpperCase() + capped.slice(1);
}

const clip = (s: string, n = 150) => (s.length > n ? s.slice(0, n).trim() + "…" : s);

// Build a deck + suggested questions by extracting from the sources.
export function quickKit(nb: StudyNotebook, ar: boolean): StudyKit {
  const all = nb.sources.map((s) => s.text).join("\n\n");
  let sents = splitSentences(all).filter((s) => s.length >= 24 && s.length <= 300);
  if (!sents.length) sents = splitSentences(all);

  // sample evenly so the whole material is covered, not just the first page
  const MAX = 15;
  if (sents.length > MAX) {
    const step = sents.length / MAX;
    sents = Array.from({ length: MAX }, (_, i) => sents[Math.floor(i * step)]);
  }

  const body: Slide[] = [];
  for (let i = 0; i < sents.length; i += 3) {
    const chunk = sents.slice(i, i + 3);
    if (!chunk.length) continue;
    body.push({ title: titleFrom(chunk[0]), bullets: chunk.map((c) => clip(c)), narration: chunk.join(" ") });
  }

  const intro: Slide = {
    title: nb.name,
    bullets: [
      ar ? `${nb.sources.length} مصدر` : `${nb.sources.length} source${nb.sources.length === 1 ? "" : "s"}`,
      ar ? "نظرة عامة سريعة على مادّتك" : "A quick overview of your material",
    ],
    narration: ar
      ? `إليك نظرة عامة سريعة على ${nb.name}. لنستعرض أهم النقاط.`
      : `Here's a quick overview of ${nb.name}. Let's walk through the key points.`,
  };
  const recap: Slide = {
    title: ar ? "الخلاصة" : "Recap",
    bullets: body.map((s) => s.title).slice(0, 6),
    narration: ar
      ? `باختصار، غطّينا: ${body.map((s) => s.title).slice(0, 6).join("، ")}.`
      : `To recap, we covered: ${body.map((s) => s.title).slice(0, 6).join(", ")}.`,
  };

  const slides = body.length ? [intro, ...body, recap] : [intro];
  return { slides, questions: heuristicQuestions(nb, ar), by: "quick", at: Date.now() };
}

// Sensible starter questions — a few generic study prompts plus one per source.
export function heuristicQuestions(nb: StudyNotebook, ar: boolean): string[] {
  const generic = ar
    ? ["لخّص أهم الأفكار.", "ما أهم المصطلحات وتعريفاتها؟", "أعطني ٥ أسئلة تدريبية.", "اشرح أصعب فكرة ببساطة."]
    : ["Summarize the key ideas.", "What are the most important terms and their definitions?", "Give me 5 practice questions.", "Explain the hardest concept simply."];
  const perSource = nb.sources.slice(0, 1).map((s) => (ar ? `اختبرني في «${s.title}».` : `Quiz me on “${s.title}”.`));
  return [...perSource, ...generic].slice(0, 5);
}
