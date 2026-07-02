"use client";

// Study Notebook — a NotebookLM-style study companion. Create notebooks, add
// sources (upload PDF/DOCX/photos or paste notes), then ask grounded questions and
// generate summaries / study guides / flashcards. Sources live per-user in local
// storage (MVP); answers stream from the `study` Edge Function (falling back to the
// existing `chat` function). Theme-aware + responsive + bilingual.

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui";
import {
  loadNotebooks, saveNotebooks, newNotebook, makeTextSource, makeFileSource, sourcesContext,
  type StudyNotebook, type StudySource, type StudyKit,
} from "@/lib/study/store";
import { askStudy, generateStudyKit, quickPrompt, type QuickAction } from "@/lib/study/ai";
import { quickKit, heuristicQuestions } from "@/lib/study/kit";
import { videos, tutors } from "@/lib/content";

const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 };

export default function StudyPage() {
  const { user } = useAuth();
  // Remount when the user changes so notebooks re-init from that user's storage.
  return <StudyInner key={user?.id || "guest"} userId={user?.id || "guest"} />;
}

function StudyInner({ userId }: { userId: string }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const msg = (en: string, arText: string) => (ar ? arText : en);
  const [supabase] = useState(() => createClient());

  const [notebooks, setNotebooks] = useState<StudyNotebook[]>(() => loadNotebooks(userId));
  const [activeId, setActiveId] = useState<string | null>(null);

  // persist on change (writing to an external store — allowed in an effect)
  useEffect(() => { saveNotebooks(userId, notebooks); }, [notebooks, userId]);

  const active = notebooks.find((n) => n.id === activeId) || null;
  const update = (id: string, fn: (n: StudyNotebook) => StudyNotebook) =>
    setNotebooks((prev) => prev.map((n) => (n.id === id ? fn(n) : n)));

  if (active) {
    return <NotebookDetail notebook={active} supabase={supabase} ar={ar} msg={msg} onBack={() => setActiveId(null)} onUpdate={(fn) => update(active.id, fn)} />;
  }
  return (
    <NotebookList
      notebooks={notebooks} msg={msg}
      onOpen={setActiveId}
      onCreate={(name) => { const nb = newNotebook(name, notebooks.length); setNotebooks((prev) => [nb, ...prev]); setActiveId(nb.id); }}
      onDelete={(id) => setNotebooks((prev) => prev.filter((n) => n.id !== id))}
    />
  );
}

// ---------------------------------------------------------------------------
// Notebook list
// ---------------------------------------------------------------------------

function NotebookList({ notebooks, msg, onOpen, onCreate, onDelete }: {
  notebooks: StudyNotebook[]; msg: (en: string, ar: string) => string; onOpen: (id: string) => void; onCreate: (name: string) => void; onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const { t, lang } = useI18n();
  const vids = videos(lang);
  const tts = tutors(lang);
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }} className="fade-up">
      <div>
        <div className="serif" style={{ fontSize: 25, fontWeight: 600, color: "var(--ink-strong)" }}>{msg("Study", "المذاكرة")}</div>
        <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 3 }}>{msg("Your notebooks, helpful videos, and tutors — all in one place.", "دفاترك، وفيديوهات مفيدة، ومدرّسون — في مكان واحد.")}</div>
      </div>

      {/* create */}
      <div style={{ ...card, padding: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onCreate(name); setName(""); } }}
          placeholder={msg("Name a new notebook (e.g. Marketing 201)", "سمِّ دفترًا جديدًا (مثال: تسويق ٢٠١)")}
          style={{ flex: 1, minWidth: 200, padding: "11px 13px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--surface-2)", fontSize: 14, color: "var(--text)", outline: "none" }}
        />
        <button onClick={() => { if (name.trim()) { onCreate(name); setName(""); } }} disabled={!name.trim()} style={{ background: name.trim() ? "#1E8378" : "var(--surface-2)", color: name.trim() ? "#fff" : "var(--faint)", border: "none", borderRadius: 11, padding: "11px 16px", fontWeight: 700, fontSize: 13.5, cursor: name.trim() ? "pointer" : "default", display: "flex", alignItems: "center", gap: 7 }}>
          <Icon name="add" size={18} />{msg("New notebook", "دفتر جديد")}
        </button>
      </div>

      {notebooks.length === 0 ? (
        <div style={{ ...card, padding: "40px 20px", textAlign: "center", color: "var(--muted)" }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>📚</div>
          <div style={{ fontSize: 14 }}>{msg("No notebooks yet. Create one above to start studying.", "لا توجد دفاتر بعد. أنشئ واحدًا بالأعلى لتبدأ المذاكرة.")}</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {notebooks.map((n) => (
            <div key={n.id} style={{ ...card, padding: 15, display: "flex", flexDirection: "column", gap: 8, cursor: "pointer", position: "relative" }} onClick={() => onOpen(n.id)}>
              <div style={{ fontSize: 26 }}>{n.emoji}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-strong)", lineHeight: 1.2 }}>{n.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{n.sources.length} {msg("sources", "مصدر")} · {n.messages.filter((m) => m.role === "user").length} {msg("questions", "سؤال")}</div>
              <button onClick={(e) => { e.stopPropagation(); if (confirm(msg("Delete this notebook?", "حذف هذا الدفتر؟"))) onDelete(n.id); }} aria-label="Delete" style={{ position: "absolute", top: 10, insetInlineEnd: 10, width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--faint)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <Icon name="delete" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* helpful videos */}
      <div>
        <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "var(--ink-strong)" }}>{msg("Watch & learn", "شاهد وتعلّم")}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>{t.videoSourcesSub}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {vids.map((v, i) => (
            <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" style={{ ...card, overflow: "hidden", textDecoration: "none", display: "block" }}>
              <div style={{ height: 122, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: "#0c1722" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumb} alt={v.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.92 }} />
                <span style={{ position: "absolute", top: 9, insetInlineStart: 9, background: "#102A40", color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{v.course}</span>
                <div style={{ position: "absolute", width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,.94)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,.3)" }}><Icon name="play_arrow" size={26} color="#C9281C" /></div>
                <span style={{ position: "absolute", bottom: 9, insetInlineEnd: 9, background: "rgba(16,42,64,.85)", color: "#fff", fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 6 }}>{v.length}</span>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)", lineHeight: 1.3 }}>{v.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}><Icon name="smart_display" size={14} color="#C9281C" />{v.source} · YouTube</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* tutors */}
      <div>
        <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "var(--ink-strong)" }}>{msg("Book a tutor", "احجز مدرّسًا")}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>{t.tutorsSub}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {tts.map((tu, i) => (
            <div key={i} style={{ ...card, padding: 15, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: tu.av, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{tu.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{tu.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tu.focus}</div>
                <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 3, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#C9892F" }}><Icon name="star" size={13} />{tu.rating}</span>
                  <span>{tu.sessionsLabel}</span>
                </div>
              </div>
              <button style={{ background: "#102A40", color: "#fff", border: "none", borderRadius: 9, padding: "8px 13px", fontSize: 12.5, fontWeight: 600, flexShrink: 0, cursor: "pointer" }}>{t.book}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notebook detail — sources + grounded chat
// ---------------------------------------------------------------------------

function NotebookDetail({ notebook, supabase, ar, msg, onBack, onUpdate }: {
  notebook: StudyNotebook; supabase: ReturnType<typeof createClient>; ar: boolean; msg: (en: string, ar: string) => string; onBack: () => void; onUpdate: (fn: (n: StudyNotebook) => StudyNotebook) => void;
}) {
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [busySource, setBusySource] = useState(false);
  const [sourceErr, setSourceErr] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<"chat" | "kit">("chat");
  const [slideIdx, setSlideIdx] = useState(0);
  const [genBusy, setGenBusy] = useState(false);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [notebook.messages, typing]);

  const addSource = (s: StudySource) => onUpdate((n) => ({ ...n, sources: [...n.sources, s] }));
  const removeSource = (id: string) => onUpdate((n) => ({ ...n, sources: n.sources.filter((s) => s.id !== id) }));

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    setBusySource(true); setSourceErr("");
    try {
      const s = await makeFileSource(file);
      if (!s.text || s.text.length < 5) setSourceErr(msg("Couldn't read much text from that file.", "تعذّرت قراءة نص كافٍ من الملف."));
      else addSource(s);
    } catch {
      setSourceErr(msg("Couldn't read that file.", "تعذّرت قراءة الملف."));
    } finally { setBusySource(false); }
  }

  function addPaste() {
    if (!pasteText.trim()) return;
    addSource(makeTextSource(pasteTitle || msg("Pasted note", "ملاحظة ملصقة"), pasteText));
    setPasteText(""); setPasteTitle(""); setPasteOpen(false);
  }

  const setLastAssistant = (content: string) =>
    onUpdate((n) => { const m = [...n.messages]; if (m.length && m[m.length - 1].role === "assistant") m[m.length - 1] = { role: "assistant", content }; return { ...n, messages: m }; });

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || typing) return;
    setInput("");
    const history = [...notebook.messages, { role: "user" as const, content: q }];
    onUpdate((n) => ({ ...n, messages: [...history, { role: "assistant", content: "" }] }));
    setTyping(true);
    try {
      await askStudy(supabase, {
        messages: history,
        context: sourcesContext(notebook),
        lang: ar ? "ar" : "en",
        onToken: (acc) => setLastAssistant(acc),
      });
    } catch {
      setLastAssistant(msg(
        "I couldn't reach the study assistant right now. Make sure the `study` function is deployed (or the OpenRouter key is set) — your sources are saved and ready.",
        "تعذّر الوصول إلى مساعد المذاكرة الآن. تأكّد من نشر دالة study (أو ضبط مفتاح OpenRouter) — مصادرك محفوظة وجاهزة.",
      ));
    } finally { setTyping(false); }
  }

  async function genKit(useAI: boolean) {
    if (!hasSources || genBusy) return;
    setGenBusy(true);
    try {
      let kit: StudyKit;
      if (useAI) {
        const r = await generateStudyKit(supabase, { context: sourcesContext(notebook), lang: ar ? "ar" : "en" });
        kit = { slides: r.slides, questions: r.questions.length ? r.questions : heuristicQuestions(notebook, ar), by: "ai", at: Date.now() };
      } else {
        kit = quickKit(notebook, ar);
      }
      onUpdate((n) => ({ ...n, kit }));
      setSlideIdx(0);
    } catch {
      onUpdate((n) => ({ ...n, kit: quickKit(notebook, ar) })); // AI unavailable → instant kit
      setSlideIdx(0);
    } finally { setGenBusy(false); }
  }

  const hasSources = notebook.sources.length > 0;
  const kit = notebook.kit;
  const suggested = kit?.questions?.length ? kit.questions : heuristicQuestions(notebook, ar);
  const quicks: { key: QuickAction; icon: string; en: string; ar: string }[] = [
    { key: "summarize", icon: "summarize", en: "Summarize", ar: "لخّص" },
    { key: "studyGuide", icon: "menu_book", en: "Study guide", ar: "دليل مذاكرة" },
    { key: "keyTerms", icon: "style", en: "Flashcards", ar: "بطاقات" },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }} className="fade-up">
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} aria-label="Back" style={{ width: 36, height: 36, borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <Icon name={ar ? "arrow_forward" : "arrow_back"} size={19} />
        </button>
        <span style={{ fontSize: 24 }}>{notebook.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--ink-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{notebook.name}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{notebook.sources.length} {msg("sources", "مصدر")}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="study-cols">
        {/* sources */}
        <div style={{ ...card, padding: 15, alignSelf: "start" }} className="study-sources">
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-strong)", marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}>
            <Icon name="folder" size={17} color="#2C6E91" />{msg("Sources", "المصادر")}
          </div>

          <input ref={fileInput} type="file" accept=".pdf,.doc,.docx,.txt,.md,image/*" onChange={onFile} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button onClick={() => fileInput.current?.click()} disabled={busySource} style={{ flex: 1, background: "var(--surface-2)", color: "#2C6E91", border: "1px dashed var(--border)", borderRadius: 10, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: busySource ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {busySource ? <span className="spin" style={{ width: 15, height: 15, border: "2px solid var(--border)", borderTopColor: "#2C6E91", borderRadius: "50%" }} /> : <Icon name="upload_file" size={16} />}
              {msg("Upload", "رفع")}
            </button>
            <button onClick={() => setPasteOpen((v) => !v)} style={{ flex: 1, background: "var(--surface-2)", color: "#2C6E91", border: "1px dashed var(--border)", borderRadius: 10, padding: "10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="content_paste" size={16} />{msg("Paste text", "لصق نص")}
            </button>
          </div>
          {sourceErr && <div style={{ fontSize: 12, color: "#B5564E", marginBottom: 8 }}>{sourceErr}</div>}

          {pasteOpen && (
            <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 7 }}>
              <input value={pasteTitle} onChange={(e) => setPasteTitle(e.target.value)} placeholder={msg("Title (optional)", "عنوان (اختياري)")} style={{ padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface-2)", fontSize: 13, color: "var(--text)", outline: "none" }} />
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={msg("Paste your notes here…", "الصق ملاحظاتك هنا…")} rows={4} style={{ padding: "9px 11px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface-2)", fontSize: 13, color: "var(--text)", outline: "none", resize: "vertical" }} />
              <button onClick={addPaste} disabled={!pasteText.trim()} style={{ background: pasteText.trim() ? "#1E8378" : "var(--surface-2)", color: pasteText.trim() ? "#fff" : "var(--faint)", border: "none", borderRadius: 9, padding: "9px", fontWeight: 700, fontSize: 13, cursor: pasteText.trim() ? "pointer" : "default" }}>{msg("Add source", "أضف مصدرًا")}</button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {notebook.sources.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <Icon name={s.kind === "file" ? "description" : "sticky_note_2"} size={17} color="#2C6E91" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "var(--faint)" }}>{Math.max(1, Math.round(s.text.length / 5))} {msg("words", "كلمة")}</div>
                </div>
                <button onClick={() => removeSource(s.id)} aria-label="Remove" style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--faint)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon name="close" size={14} /></button>
              </div>
            ))}
            {!hasSources && <div style={{ fontSize: 12.5, color: "var(--muted)", padding: "6px 2px" }}>{msg("Add a source to ground your answers. 📎", "أضف مصدرًا لتُبنى الإجابات عليه. 📎")}</div>}
          </div>
        </div>

        {/* right panel: Chat + Study kit */}
        <div style={{ ...card, display: "flex", flexDirection: "column", minHeight: 460, overflow: "hidden" }} className="study-chat">
          <div style={{ display: "flex", gap: 4, padding: 8, borderBottom: "1px solid var(--border)" }}>
            {([["chat", "chat", "Chat", "محادثة"], ["kit", "slideshow", "Study kit", "حقيبة المذاكرة"]] as const).map(([key, ic, en, arL]) => {
              const on = tab === key;
              return (
                <button key={key} onClick={() => setTab(key)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "none", borderRadius: 10, padding: "9px", fontSize: 13, fontWeight: 700, cursor: "pointer", background: on ? "var(--surface-2)" : "transparent", color: on ? "var(--ink-strong)" : "var(--muted)" }}>
                  <Icon name={ic} size={17} color={on ? "#1E8378" : "var(--faint)"} />{ar ? arL : en}
                </button>
              );
            })}
          </div>

          {tab === "chat" ? (
            <>
              <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
                {notebook.messages.length === 0 ? (
                  <div style={{ margin: "auto", textAlign: "center", color: "var(--muted)", maxWidth: 360 }}>
                    <div style={{ fontSize: 30, marginBottom: 8 }}>💬</div>
                    <div style={{ fontSize: 13.5, marginBottom: hasSources ? 12 : 0 }}>{hasSources ? msg("Ask anything about your sources, or try one:", "اسأل أي شيء عن مصادرك، أو جرّب أحدها:") : msg("Add a source, then ask questions grounded in it.", "أضف مصدرًا، ثم اسأل أسئلة مبنيّة عليه.")}</div>
                    {hasSources && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {suggested.slice(0, 4).map((qn, i) => (
                          <button key={i} onClick={() => send(qn)} style={{ textAlign: "start", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 11px", fontSize: 12.5, color: "var(--text)", cursor: "pointer" }}>💡 {qn}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  notebook.messages.map((m, i) => (
                    <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                      <div style={{ padding: "10px 13px", borderRadius: 14, fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap", background: m.role === "user" ? "#1E8378" : "var(--surface-2)", color: m.role === "user" ? "#fff" : "var(--text)", borderTopRightRadius: m.role === "user" ? 4 : 14, borderTopLeftRadius: m.role === "user" ? 14 : 4 }}>
                        {m.content || (typing ? <span style={{ color: "var(--faint)" }}>…</span> : "")}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: "flex", gap: 7, padding: "8px 12px 0", flexWrap: "wrap" }}>
                {quicks.map((qa) => (
                  <button key={qa.key} onClick={() => send(quickPrompt(qa.key, ar))} disabled={typing || !hasSources} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 20, padding: "7px 11px", fontSize: 12, fontWeight: 600, color: hasSources ? "var(--text)" : "var(--faint)", cursor: typing || !hasSources ? "default" : "pointer" }}>
                    <Icon name={qa.icon} size={14} color="#1E8378" />{ar ? qa.ar : qa.en}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, padding: 12 }}>
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder={msg("Ask about your sources…", "اسأل عن مصادرك…")} style={{ flex: 1, padding: "11px 13px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-2)", fontSize: 14, color: "var(--text)", outline: "none" }} />
                <button onClick={() => send()} disabled={typing || !input.trim()} aria-label="Send" style={{ width: 44, borderRadius: 12, border: "none", background: input.trim() && !typing ? "#1E8378" : "var(--surface-2)", color: input.trim() && !typing ? "#fff" : "var(--faint)", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() && !typing ? "pointer" : "default", flexShrink: 0 }}>
                  <Icon name="send" size={19} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
              {!kit ? (
                <div style={{ margin: "auto", textAlign: "center", color: "var(--muted)", maxWidth: 380 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
                  <div style={{ fontSize: 14, marginBottom: 14 }}>{msg("Turn your sources into clean study slides you can flip through.", "حوّل مصادرك إلى شرائح مذاكرة واضحة يمكنك تصفّحها.")}</div>
                  {!hasSources ? (
                    <div style={{ fontSize: 12.5 }}>{msg("Add a source first.", "أضف مصدرًا أولًا.")}</div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                      <button onClick={() => genKit(false)} disabled={genBusy} style={{ background: "#1E8378", color: "#fff", border: "none", borderRadius: 11, padding: "11px 16px", fontWeight: 700, fontSize: 13.5, cursor: genBusy ? "default" : "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                        {genBusy ? <span className="spin" style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff", borderRadius: "50%" }} /> : <Icon name="bolt" size={17} />}{msg("Create study kit", "أنشئ حقيبة مذاكرة")}
                      </button>
                      <button onClick={() => genKit(true)} disabled={genBusy} style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 11, padding: "11px 16px", fontWeight: 600, fontSize: 13, cursor: genBusy ? "default" : "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                        <Icon name="auto_awesome" size={16} color="#1E8378" />{msg("Enhance with AI", "تحسين بالذكاء")}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-strong)", display: "flex", alignItems: "center", gap: 7 }}><Icon name="slideshow" size={17} color="#1E8378" />{msg("Study slides", "شرائح المذاكرة")}</div>
                    <button onClick={() => genKit(true)} disabled={genBusy} title={msg("Regenerate slides", "إعادة إنشاء الشرائح")} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 20, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--muted)", padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: genBusy ? "default" : "pointer" }}>
                      {genBusy ? <span className="spin" style={{ width: 14, height: 14, border: "2px solid var(--border)", borderTopColor: "#1E8378", borderRadius: "50%" }} /> : <Icon name="refresh" size={16} />}{msg("Regenerate", "إعادة")}
                    </button>
                  </div>

                  {(() => {
                    const idx = Math.min(slideIdx, kit.slides.length - 1);
                    const s = kit.slides[idx];
                    return (
                      <div style={{ border: "2px solid var(--border)", borderRadius: 16, background: "var(--surface-2)", padding: 18, minHeight: 190, display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#1E8378", textTransform: "uppercase", letterSpacing: ".05em" }}>{msg("Slide", "شريحة")} {idx + 1}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-strong)", lineHeight: 1.25 }}>{s.title}</div>
                        <ul style={{ margin: 0, paddingInlineStart: 20, display: "flex", flexDirection: "column", gap: 7 }}>
                          {s.bullets.map((b, bi) => <li key={bi} style={{ fontSize: 13.5, color: "var(--text)", lineHeight: 1.5 }}>{b}</li>)}
                        </ul>
                      </div>
                    );
                  })()}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
                    <button onClick={() => setSlideIdx((i) => Math.max(0, i - 1))} disabled={slideIdx <= 0} aria-label="Previous" style={{ width: 36, height: 36, borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", cursor: slideIdx <= 0 ? "default" : "pointer", opacity: slideIdx <= 0 ? 0.5 : 1 }}><Icon name={ar ? "chevron_right" : "chevron_left"} size={20} /></button>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>{slideIdx + 1} / {kit.slides.length}</span>
                    <button onClick={() => setSlideIdx((i) => Math.min(kit.slides.length - 1, i + 1))} disabled={slideIdx >= kit.slides.length - 1} aria-label="Next" style={{ width: 36, height: 36, borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", cursor: slideIdx >= kit.slides.length - 1 ? "default" : "pointer", opacity: slideIdx >= kit.slides.length - 1 ? 0.5 : 1 }}><Icon name={ar ? "chevron_left" : "chevron_right"} size={20} /></button>
                  </div>

                  {kit.by === "quick" && <div style={{ fontSize: 11.5, color: "var(--faint)", textAlign: "center" }}>{msg("Quick slides from your text · tap Regenerate for an AI-written deck.", "شرائح سريعة من نصّك · اضغط إعادة لعرض مكتوب بالذكاء.")}</div>}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* responsive: two columns on wide screens */}
      <style>{`
        @media (min-width: 900px) {
          .study-cols { display: grid; grid-template-columns: 300px 1fr; align-items: start; }
          .study-sources { position: sticky; top: 0; }
          .study-chat { height: min(72vh, 640px); }
        }
      `}</style>
    </div>
  );
}
