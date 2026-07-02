// Grounded study Q&A client. Streams from the dedicated `study` Edge Function; if
// that isn't deployed yet, it falls back to the existing `chat` function (passing
// the notebook's sources as `context`) so the feature works today. Mirrors the
// streaming contract AdvisorChat already uses.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { StudyMessage, Slide } from "@/lib/study/store";

export type QuickAction = "summarize" | "studyGuide" | "keyTerms";

export function quickPrompt(action: QuickAction, ar: boolean): string {
  const en: Record<QuickAction, string> = {
    summarize: "Summarize the key points of my sources in clear, tight bullet points.",
    studyGuide: "Create a concise study guide from my sources: the main topics, the key concepts under each, and 5 short review questions at the end.",
    keyTerms: "List the important key terms from my sources as flashcards, one per line, formatted 'Term — definition'.",
  };
  const arabic: Record<QuickAction, string> = {
    summarize: "لخّص أهم النقاط من مصادري في نقاط واضحة ومختصرة.",
    studyGuide: "أنشئ دليل مذاكرة موجزًا من مصادري: المواضيع الرئيسية، والمفاهيم الأساسية تحت كل موضوع، و٥ أسئلة مراجعة قصيرة في النهاية.",
    keyTerms: "اذكر أهم المصطلحات من مصادري على شكل بطاقات، مصطلح في كل سطر بصيغة 'المصطلح — التعريف'.",
  };
  return (ar ? arabic : en)[action];
}

type AskOpts = {
  messages: StudyMessage[];
  context: string; // combined source text
  lang: string;
  onToken?: (accumulated: string) => void;
  signal?: AbortSignal;
};

// Returns the full answer text. Throws "no-ai" if neither function produced a
// streamed answer (e.g. no OpenRouter key / nothing deployed).
export async function askStudy(supabase: SupabaseClient, opts: AskOpts): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("no-ai");

  const { data: { session } } = await supabase.auth.getSession();
  const headers = {
    "Content-Type": "application/json",
    apikey: anon,
    Authorization: `Bearer ${session?.access_token ?? ""}`,
  };
  const body = JSON.stringify({ messages: opts.messages, lang: opts.lang, context: opts.context, mode: "study" });

  for (const fn of ["study", "chat"] as const) {
    try {
      const res = await fetch(`${url}/functions/v1/${fn}`, { method: "POST", headers, body, signal: opts.signal });
      if (!res.ok || !res.body) continue;

      // A JSON response from `chat` is its "no live model" signal — not a usable
      // study answer — so skip it and try the next option.
      if ((res.headers.get("content-type") || "").includes("application/json")) continue;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        opts.onToken?.(acc);
      }
      if (acc.trim()) return acc;
    } catch (e) {
      if ((e as Error)?.name === "AbortError") throw e;
      // try the next function
    }
  }
  throw new Error("no-ai");
}

// Ask the study function to generate a richer slide deck + questions (JSON). Only
// tries `study` (the `chat` function can't produce this). Throws "no-ai" if it's
// not deployed — callers fall back to the client-side quickKit.
export async function generateStudyKit(
  supabase: SupabaseClient,
  opts: { context: string; lang: string },
): Promise<{ slides: Slide[]; questions: string[] }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("no-ai");

  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${url}/functions/v1/study`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: anon, Authorization: `Bearer ${session?.access_token ?? ""}` },
    body: JSON.stringify({ mode: "slides", context: opts.context, lang: opts.lang }),
  });
  if (!res.ok || !(res.headers.get("content-type") || "").includes("application/json")) throw new Error("no-ai");

  const j = await res.json().catch(() => null);
  if (!j || !Array.isArray(j.slides) || !j.slides.length) throw new Error("no-ai");
  const slides: Slide[] = j.slides.map((s: { title?: string; bullets?: string[]; narration?: string }) => ({
    title: String(s.title ?? ""),
    bullets: Array.isArray(s.bullets) ? s.bullets.map(String) : [],
    narration: String(s.narration ?? s.title ?? ""),
  }));
  const questions: string[] = Array.isArray(j.questions) ? j.questions.map(String).slice(0, 6) : [];
  return { slides, questions };
}
