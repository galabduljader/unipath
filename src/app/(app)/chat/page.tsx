"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n, type Lang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { Icon } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { computePlan, computeGpaFrom, resolvePlanCourses, programTotalCredits } from "@/lib/catalog";
import { suggestedPrompts } from "@/lib/content";

type ChatMsg = { role: "user" | "assistant"; content: string };

function ruleReply(q: string, lang: Lang, gpaStr: string, credits: number, plan: { doneCredits: number; reqCredits: number; remainingCredits: number; pct: number; gradTerm: string }) {
  const l = q.toLowerCase();
  const g = parseFloat(gpaStr);
  const dean = g >= 3.75 ? "" : (3.75 - g).toFixed(2);
  const R: Record<string, { en: string; ar: string }> = {
    gpa: {
      en: `Your cumulative GPA is ${gpaStr} across ${credits} graded credits — solid standing. ${g >= 3.75 ? "You're already on the Dean's List." : `You're ${dean} points below the 3.75 Dean's List line; one B lifted to an A- in a 3-credit course gets you most of the way.`}`,
      ar: `معدّلك التراكمي ${gpaStr} على ${credits} ساعة محتسبة — وضع جيد. ${g >= 3.75 ? "أنت بالفعل على قائمة الشرف." : `تبعدين ${dean} نقطة عن حد قائمة الشرف ٣٫٧٥؛ رفع درجة B إلى A- في مادة من ٣ ساعات يقرّبك كثيراً.`}`,
    },
    grad: {
      en: `You've completed ${plan.doneCredits} of ${plan.reqCredits} credits (${plan.pct}%), with ${plan.remainingCredits} remaining. On your current pace you're on track to graduate in ${plan.gradTerm}. Staying at 15 credits each term keeps that date firm.`,
      ar: `أكملتِ ${plan.doneCredits} من ${plan.reqCredits} ساعة (${plan.pct}٪)، ويتبقّى ${plan.remainingCredits} ساعة. على وتيرتك الحالية أنت على المسار للتخرج في ${plan.gradTerm}. الالتزام بـ ١٥ ساعة كل فصل يثبّت الموعد.`,
    },
    next: {
      en: "For next term you're eligible for Operating Systems (CS 340), Database Systems (CS 360), Algorithms (CS 350), Applied Statistics (STAT 320) and Technical Writing (ENGL 210) — a balanced 15-credit term with all prerequisites met. See My Plan.",
      ar: "للفصل القادم أنت مؤهلة لـ: نظم التشغيل (CS 340)، قواعد البيانات (CS 360)، الخوارزميات (CS 350)، الإحصاء التطبيقي (STAT 320)، والكتابة التقنية (ENGL 210) — فصل متوازن من ١٥ ساعة بمتطلبات مكتملة. راجعي خطة الدراسة.",
    },
    elective: {
      en: "You've completed 6 of 18 required CS elective credits, so 12 credits (4 courses) remain. Machine Learning and AI count here once you finish CS 350 Algorithms.",
      ar: "أكملتِ ٦ من أصل ١٨ ساعة مطلوبة للمواد الاختيارية، فيتبقّى ١٢ ساعة (٤ مواد). تعلّم الآلة والذكاء الاصطناعي تُحتسبان هنا بعد إنهاء CS 350.",
    },
    ml: {
      en: "Not yet — CS 440 Machine Learning requires CS 350 Algorithms, which you haven't taken. Take CS 350 next term and Machine Learning unlocks the term after.",
      ar: "ليس بعد — مادة CS 440 تعلّم الآلة تتطلب CS 350 الخوارزميات التي لم تأخذيها. خذي CS 350 الفصل القادم وستُفتح تعلّم الآلة بعده.",
    },
    tutor: {
      en: "I'd book Maryam Al-Hashemi (Statistics & ML, 5.0) and Yousef Al-Rashidi (Algorithms, 4.9). You'll find both under Resources → Tutors.",
      ar: "أنصح بحجز مريم الهاشمي (الإحصاء وتعلّم الآلة، ٥٫٠) ويوسف الرشيدي (الخوارزميات، ٤٫٩). تجدينهما في المصادر ← المدرّسون.",
    },
    video: {
      en: "For Operating Systems start with Neso Academy's OS series, and for Algorithms use MIT OpenCourseWare. Both are pinned under Resources → Video sources.",
      ar: "لنظم التشغيل ابدئي بسلسلة Neso Academy، وللخوارزميات استخدمي MIT OpenCourseWare. كلاهما مثبّت في المصادر ← مصادر الفيديو.",
    },
    def: {
      en: `You've completed ${plan.doneCredits} of ${plan.reqCredits} credits (${plan.pct}%), with ${plan.remainingCredits} left, and you're on track for ${plan.gradTerm}. Ask me about eligible courses, electives, or your graduation timeline.`,
      ar: `أكملتِ ${plan.doneCredits} من ${plan.reqCredits} ساعة (${plan.pct}٪)، ويتبقّى ${plan.remainingCredits}، وأنت على المسار للتخرج في ${plan.gradTerm}. اسأليني عن المواد المتاحة أو الاختيارية أو موعد تخرجك.`,
    },
  };
  let k = "def";
  if (/gpa|grade|معدل|درجات/.test(l)) k = "gpa";
  else if (/tutor|مدرس|مدرّس/.test(l)) k = "tutor";
  else if (/video|resource|watch|فيديو|مصدر|مصادر/.test(l)) k = "video";
  else if (/graduat|تخرج|متى/.test(l)) k = "grad";
  else if (/machine|تعلّم|تعلم الال/.test(l)) k = "ml";
  else if (/elective|اختياري/.test(l)) k = "elective";
  else if (/next|take|قادم|آخذ|متاح/.test(l)) k = "next";
  return R[k][lang];
}

export default function ChatPage() {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const { completed, grades, programCourses } = useData();
  const supabase = useRef(createClient()).current;

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const major = profile?.major || "Computer Science";
  const planCourses = useMemo(() => resolvePlanCourses(programCourses, major), [programCourses, major]);
  const total = useMemo(() => programTotalCredits(major, programCourses), [major, programCourses]);
  const plan = useMemo(() => computePlan(planCourses, completed, lang, t, total), [planCourses, completed, lang, t, total]);
  const gpaInfo = useMemo(() => {
    const courses = [...completed].map((code) => {
      const tup = planCourses.find((c) => c[0] === code);
      return { code, credits: tup ? tup[3] : 3 };
    });
    return computeGpaFrom(courses, grades);
  }, [completed, planCourses, grades]);

  useEffect(() => {
    if (!user) return;
    supabase.from("chat_messages").select("role, content").eq("user_id", user.id).order("created_at").then(({ data }) => {
      if (data) setMessages(data as ChatMsg[]);
    });
  }, [user, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const greeting = lang === "ar"
    ? `مرحباً ${(profile?.username || "").split(" ")[0] || "بك"}، أنا مرشدك الذكي. أعرف خطتك الدراسية بالكامل — اسأليني متى ستتخرّجين، أو ماذا تأخذين الفصل القادم، أو كم تبقّى من المتطلبات.`
    : `Hi ${(profile?.username || "").split(" ")[0] || "there"} — I'm your AI advisor. I know your full degree plan, so ask me when you'll graduate, what to take next term, or how many requirements are left.`;

  const display = messages.length ? messages : [{ role: "assistant" as const, content: greeting }];
  const showSuggestions = messages.length === 0 && !typing;
  const suggestions = suggestedPrompts(lang);

  function persist(m: ChatMsg) {
    if (user) supabase.from("chat_messages").insert({ user_id: user.id, role: m.role, content: m.content }).then(() => {});
  }

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || typing) return;
    setInput("");
    const userMsg: ChatMsg = { role: "user", content: q };
    const history = [...messages, userMsg];
    setMessages(history);
    persist(userMsg);
    setTyping(true);

    const context =
      `Major: ${major}. Completed ${plan.doneCredits}/${plan.reqCredits} credits (${plan.pct}%). ` +
      `Remaining: ${plan.remainingCredits} credits, ${plan.semestersLeft} semesters. Expected graduation: ${plan.gradTerm}. ` +
      `GPA: ${gpaInfo.gpa.toFixed(2)} over ${gpaInfo.credits} graded credits.`;

    try {
      // Call the Supabase Edge Function (holds the OpenRouter key in Supabase secrets).
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${session?.access_token ?? ""}`,
          },
          body: JSON.stringify({ messages: history, lang, context }),
        }
      );

      const ctype = res.headers.get("content-type") || "";
      if (ctype.includes("application/json")) {
        // fallback path → built-in advisor
        await new Promise((r) => setTimeout(r, 700));
        const reply = ruleReply(q, lang, gpaInfo.gpa.toFixed(2), gpaInfo.credits, plan);
        const m: ChatMsg = { role: "assistant", content: reply };
        setTyping(false);
        setMessages((prev) => [...prev, m]);
        persist(m);
        return;
      }

      // streaming path
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setTyping(false);
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => { const copy = [...prev]; copy[copy.length - 1] = { role: "assistant", content: acc }; return copy; });
      }
      persist({ role: "assistant", content: acc });
    } catch {
      const reply = ruleReply(q, lang, gpaInfo.gpa.toFixed(2), gpaInfo.credits, plan);
      setTyping(false);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", height: "100%", display: "flex", flexDirection: "column" }} className="fade-up">
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 520 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#1E8378,#2C6E91)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Icon name="auto_awesome" size={23} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink-strong)" }}>{t.chatTitle}</div>
            <div style={{ fontSize: 12, color: "#1E8378", display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1E8378" }} />{t.chatScope}</div>
          </div>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14, background: "var(--surface-2)" }}>
          {display.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={m.role === "user"
                ? { maxWidth: "78%", background: "#102A40", color: "#fff", borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomLeftRadius: 14, borderBottomRightRadius: 4, padding: "12px 15px", fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap" }
                : { maxWidth: "82%", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomLeftRadius: 4, borderBottomRightRadius: 14, padding: "12px 15px", fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                {m.content}
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ alignSelf: "flex-start", background: "var(--surface)", border: "1px solid var(--border)", borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomLeftRadius: 4, borderBottomRightRadius: 14, padding: "13px 16px", display: "flex", gap: 5 }}>
              {[0, 0.2, 0.4].map((d) => (
                <span key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: "#9aa6ad", animation: `blink 1.2s infinite ${d}s` }} />
              ))}
            </div>
          )}
        </div>

        {showSuggestions && (
          <div style={{ display: "flex", gap: 8, padding: "0 20px 12px", flexWrap: "wrap" }}>
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} style={{ background: "#EAF1F7", color: "#2C6E91", border: "1px solid #D5E3EC", borderRadius: 20, padding: "8px 14px", fontSize: 12.5, fontWeight: 500 }}>{s}</button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, padding: "14px 16px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={t.askPlaceholder} style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 11, padding: "12px 14px", fontSize: 14, outline: "none", color: "var(--text)", background: "var(--surface-2)" }} />
          <button onClick={() => send()} style={{ width: 46, height: 46, borderRadius: 11, background: "#102A40", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={lang === "ar" ? "arrow_back" : "send"} size={21} /></button>
        </div>
      </div>
    </div>
  );
}
