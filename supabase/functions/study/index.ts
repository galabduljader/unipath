// study — a grounded study tutor. Given the student's notebook sources (as
// `context`) and their chat `messages`, it answers ONLY from those sources and
// streams the reply as plain text (same contract the app's chat function uses).
//
// Secret: OPENROUTER_API_KEY (Supabase Edge Function secret). Optional STUDY_MODEL.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = Deno.env.get("STUDY_MODEL") ?? "anthropic/claude-sonnet-4.5";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function systemPrompt(ar: boolean, context: string): string {
  const base = ar
    ? `أنت مُدرّس مذاكرة ودود لطالب جامعي. أجب باستخدام مواد المذاكرة أدناه فقط. إذا لم تكن الإجابة موجودة في المواد، قل بوضوح إنها غير موجودة في المصادر واقترح ما قد يبحث عنه الطالب. كن موجزًا وواضحًا، واستخدم نقاطًا عند المناسبة، وبلغة مشجّعة.`
    : `You are a friendly study tutor for a university student. Answer using ONLY the study materials below. If the answer isn't in the materials, say clearly that it's not in the sources and suggest what the student might look for. Be concise and clear, use bullet points where helpful, and keep an encouraging tone.`;
  const noSrc = ar ? "\n\n(لا توجد مصادر بعد — اطلب من الطالب إضافة مصدر.)" : "\n\n(No sources yet — invite the student to add one.)";
  return `${base}\n\nSTUDY MATERIALS:\n${context?.trim() ? context : noSrc}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) return new Response(JSON.stringify({ error: "no-key" }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });

  let payload: { messages?: { role: string; content: string }[]; lang?: string; context?: string; mode?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad request", { status: 400, headers: CORS });
  }
  const ar = payload.lang === "ar";

  // Slides mode → a one-shot JSON study kit (deck + questions), not a stream.
  if (payload.mode === "slides") {
    const instruction = ar
      ? `من مواد المذاكرة التالية، أنشئ حقيبة مذاكرة بصيغة JSON فقط بالشكل {"slides":[{"title":"","bullets":["",""],"narration":""}],"questions":["",""]}. اجعل ٦ إلى ٨ شرائح، كل شريحة ٢-٤ نقاط قصيرة، و"narration" جملتان أو ثلاث يقولها الراوي. و٥ أسئلة مذاكرة جيدة. أعِد JSON فقط بدون أي نص آخر.\n\nالمواد:\n${payload.context ?? ""}`
      : `From the study materials below, produce a study kit as JSON ONLY, shaped {"slides":[{"title":"","bullets":["",""],"narration":""}],"questions":["",""]}. Make 6–8 slides, each with 2–4 short bullets and a "narration" of 2–3 sentences a narrator would say. Add 5 good study questions. Return ONLY the JSON, no other text.\n\nMaterials:\n${payload.context ?? ""}`;
    const kitRes = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "HTTP-Referer": "https://unipath.app", "X-Title": "UniPath study kit" },
      body: JSON.stringify({ model: MODEL, temperature: 0.4, response_format: { type: "json_object" }, messages: [{ role: "user", content: instruction }] }),
    });
    if (!kitRes.ok) return new Response(JSON.stringify({ error: "upstream" }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    const kitJson = await kitRes.json().catch(() => null);
    const raw = kitJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown = {};
    try { parsed = JSON.parse(String(raw).replace(/^```json\s*|\s*```$/g, "")); } catch { parsed = {}; }
    return new Response(JSON.stringify(parsed), { headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const history = (payload.messages ?? []).slice(-12).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content ?? "") }));

  const upstream = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://unipath.app",
      "X-Title": "UniPath study tutor",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      temperature: 0.3,
      messages: [{ role: "system", content: systemPrompt(ar, payload.context ?? "") }, ...history],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(JSON.stringify({ error: "upstream", detail: await upstream.text().catch(() => "") }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  // Transform OpenRouter's SSE into a plain-text token stream for the client.
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const delta = json?.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              /* keep-alive / partial line — ignore */
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" } });
});
