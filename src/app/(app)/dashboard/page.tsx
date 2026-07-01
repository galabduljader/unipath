"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { useAdvisor } from "@/lib/advisorContext";
import { Icon } from "@/components/ui";
import { computePlan, computeGpaFrom, resolvePlanCourses, computePace, programTotalCredits, GRAD_MIN_GPA, toArabicDigits } from "@/lib/catalog";
import { buildGraph, suggestedNext } from "@/lib/graph";

export default function DashboardPage() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const { completed, grades, programCourses, events } = useData();
  const advisor = useAdvisor();
  const router = useRouter();
  const ar = lang === "ar";
  const numf = (n: number) => (ar ? toArabicDigits(n) : String(n));

  const firstName = (profile?.username || "Student").split(" ")[0];
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
  const suggestions = useMemo(() => suggestedNext(buildGraph(planCourses, completed), 4), [planCourses, completed]);
  const top = suggestions[0];

  // fixed date for SSR, live after mount (keeps greeting + pacing honest)
  const [now, setNow] = useState<Date>(() => new Date(2026, 6, 1, 9, 0));
  useEffect(() => setNow(new Date()), []);
  const pace = useMemo(() => computePace(profile?.cohort, plan.doneCredits, plan.reqCredits, now), [profile?.cohort, plan.doneCredits, plan.reqCredits, now]);

  const hour = now.getHours();
  const greeting = hour < 12 ? (ar ? "صباح الخير" : "Good morning") : hour < 18 ? (ar ? "مساء الخير" : "Good afternoon") : (ar ? "مساء الخير" : "Good evening");

  const eligible = plan.doneCredits >= total && gpaInfo.gradedCount > 0 && gpaInfo.gpa >= GRAD_MIN_GPA;
  const behind = pace.status === "behind" || pace.status === "slightly";

  // one plain-language status sentence — the advisor "speaking first"
  const status = (() => {
    if (pace.status === "new")
      return ar
        ? "أهلاً بك! لنرسم طريقك إلى التخرّج خطوة بخطوة. ابدأ برفع كشف تخصّصك."
        : "Welcome! Let's map your path to graduation, one step at a time. Start by uploading your major sheet.";
    if (eligible)
      return ar ? "لقد استوفيتَ كل متطلبات التخرّج. مبروك! 🎉" : "You've met every graduation requirement. Congratulations! 🎉";
    if (behind)
      return ar
        ? `أنت متأخّر قليلاً عن خطتك — لكنه قابل للتدارك. أنجزتَ ${numf(plan.doneCredits)} من ${numf(total)} ساعة، والمتوقّع تخرّجك ${plan.gradTerm}.`
        : `You're a little behind your plan — but it's fixable. You've done ${plan.doneCredits} of ${total} credits and you're heading for ${plan.gradTerm}.`;
    return ar
      ? `أنت على المسار الصحيح 👌 أنجزتَ ${numf(plan.doneCredits)} من ${numf(total)} ساعة، والمتوقّع تخرّجك ${plan.gradTerm}.`
      : `You're on track. You've completed ${plan.doneCredits} of ${total} credits and you're heading for ${plan.gradTerm}.`;
  })();

  // the single next move
  const move = (() => {
    if (eligible) return { title: ar ? "جاهز للتخرّج" : "You're ready to graduate", sub: ar ? "راجع متطلباتك النهائية" : "Review your final checklist", icon: "workspace_premium", go: () => router.push("/courses") };
    if (behind) return { title: ar ? "لنلحق بالركب" : "Let's catch up", sub: ar ? "جرّب خطة فصول أكبر قليلاً" : "Try a slightly fuller-term plan", icon: "trending_up", go: () => router.push("/courses") };
    if (top) return { title: ar ? "خطوتك التالية" : "Your next move", sub: ar ? `خذ ${top.code} — ${top.title}` : `Take ${top.code} — ${top.title}`, icon: "bolt", go: () => router.push("/courses") };
    return { title: ar ? "خطّط لفصلك القادم" : "Plan your next term", sub: ar ? "شاهد خريطة تخصّصك" : "See your degree map", icon: "map", go: () => router.push("/courses") };
  })();

  // this week
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const upcoming = useMemo(
    () => events.filter((e) => e.event_date >= todayStr).sort((a, b) => a.event_date.localeCompare(b.event_date))[0],
    [events, todayStr]
  );
  const upcomingSoon = (() => {
    if (!upcoming) return null;
    const d = (new Date(upcoming.event_date).getTime() - new Date(todayStr).getTime()) / 86400000;
    return d <= 10 ? upcoming : null;
  })();

  const chips = ar
    ? ["متى سأتخرّج؟", "ماذا آخذ الفصل القادم؟", "كيف حال معدّلي؟"]
    : ["When will I graduate?", "What should I take next?", "How's my GPA?"];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }} className="fade-up">
      {/* greeting + advisor status */}
      <div style={{ paddingTop: 6 }}>
        <div className="serif" style={{ fontSize: 27, fontWeight: 600, color: "var(--ink-strong)", lineHeight: 1.15 }}>{greeting}, {firstName}</div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#1E8378,#2C6E91)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="auto_awesome" size={22} />
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, borderTopLeftRadius: 4, padding: "14px 16px", fontSize: 15, lineHeight: 1.55, color: "var(--text)" }}>
          {status}
        </div>
      </div>

      {/* the one next move */}
      <button onClick={move.go} style={{ textAlign: "start", cursor: "pointer", border: "none", borderRadius: 18, padding: "18px 20px", background: "linear-gradient(135deg,#102A40,#1E5E78)", color: "#fff", display: "flex", alignItems: "center", gap: 15 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name={move.icon} size={26} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 2 }}>{ar ? "الآن" : "Right now"}</div>
          <div className="serif" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.15 }}>{move.title}</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{move.sub}</div>
        </div>
        <Icon name={ar ? "arrow_back" : "arrow_forward"} size={22} />
      </button>

      {/* ask the advisor — tappable, no typing needed */}
      <div>
        <div style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600, marginBottom: 8, paddingInlineStart: 2 }}>{ar ? "اسأل مرشدك" : "Ask your advisor"}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {chips.map((c) => (
            <button key={c} onClick={() => advisor.open(c)} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "9px 13px", fontSize: 13, fontWeight: 500, color: "var(--text)", cursor: "pointer" }}>
              <Icon name="auto_awesome" size={14} color="#1E8378" />{c}
            </button>
          ))}
        </div>
      </div>

      {/* quiet progress — one glance */}
      <button onClick={() => router.push("/courses")} style={{ textAlign: "start", cursor: "pointer", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-strong)" }}>{ar ? "تقدّمك" : "Your progress"}</span>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{numf(plan.doneCredits)} / {numf(total)} · {numf(plan.pct)}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 6, background: "var(--track)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 6, background: "linear-gradient(90deg,#1E8378,#2A9D8F)", width: `${plan.pct}%`, transition: "width .6s ease" }} />
        </div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="school" size={15} color="#2C6E91" />{ar ? `التخرّج المتوقّع ${plan.gradTerm}` : `On track for ${plan.gradTerm}`}
        </div>
      </button>

      {/* this week — calm reassurance */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 14, padding: "13px 16px" }}>
        <Icon name={upcomingSoon ? "event" : "check_circle"} size={20} color={upcomingSoon ? "#2C6E91" : "#1E8378"} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {upcomingSoon ? (
            <>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{upcomingSoon.title}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{ar ? "قادم" : "Coming up"} · {upcomingSoon.event_date}{upcomingSoon.course ? ` · ${upcomingSoon.course}` : ""}</div>
            </>
          ) : (
            <div style={{ fontSize: 13.5, color: "var(--muted)" }}>{ar ? "لا شيء عاجل هذا الأسبوع. خذ نفساً 🌱" : "Nothing urgent this week. Take a breath 🌱"}</div>
          )}
        </div>
        <button onClick={() => router.push("/calendar")} aria-label="Calendar" style={{ background: "none", border: "none", color: "var(--faint)", cursor: "pointer", display: "flex", padding: 4 }}><Icon name="chevron_right" size={20} /></button>
      </div>
    </div>
  );
}
