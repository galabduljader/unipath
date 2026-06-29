"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { Icon } from "@/components/ui";
import { computePlan, computeGpaFrom, resolvePlanCourses, computePace, programTotalCredits, advancedCredits, GRAD_MIN_GPA, ADVANCED_MIN_CREDITS, type PaceStatus } from "@/lib/catalog";
import { eligibleCourses } from "@/lib/content";

const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 22 };

export default function DashboardPage() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const { completed, grades, programCourses } = useData();
  const router = useRouter();

  const major = profile?.major || "Computer Science";
  const planCourses = useMemo(() => resolvePlanCourses(programCourses, major), [programCourses, major]);
  const total = useMemo(() => programTotalCredits(major, programCourses), [major, programCourses]);
  const usingSample = programCourses.length === 0;
  const plan = useMemo(() => computePlan(planCourses, completed, lang, t, total), [planCourses, completed, lang, t, total]);
  const gpaInfo = useMemo(() => {
    const courses = [...completed].map((code) => {
      const tup = planCourses.find((c) => c[0] === code);
      return { code, credits: tup ? tup[3] : 3 };
    });
    return computeGpaFrom(courses, grades);
  }, [completed, planCourses, grades]);
  const gpa = gpaInfo.gradedCount ? gpaInfo.gpa.toFixed(2) : "—";
  const advDone = useMemo(() => advancedCredits(completed, planCourses), [completed, planCourses]);

  // official graduation requirements
  const reqCreditsMet = plan.doneCredits >= total;
  const gpaMet = gpaInfo.gradedCount > 0 && gpaInfo.gpa >= GRAD_MIN_GPA;
  const advMet = advDone >= ADVANCED_MIN_CREDITS;
  const gradReqs = [
    { label: lang === "ar" ? "الحد الأدنى للساعات" : "Minimum credits", value: `${plan.doneCredits} / ${total}`, met: reqCreditsMet, icon: "school" },
    { label: lang === "ar" ? "المعدل التراكمي ≥ ٢٫٠" : "Cumulative GPA ≥ 2.0", value: gpaInfo.gradedCount ? `${gpaInfo.gpa.toFixed(2)} / 2.00` : "—", met: gpaMet, icon: "grade" },
    { label: lang === "ar" ? "ساعات المستوى المتقدّم (٣٠٠+)" : "Advanced-level credits (300+)", value: `${advDone} / ${ADVANCED_MIN_CREDITS}`, met: advMet, icon: "trending_up" },
  ];
  const eligible = reqCreditsMet && gpaMet && advMet;
  const firstName = (profile?.username || "Student").split(" ")[0];
  const elig = eligibleCourses(lang).slice(0, 4);

  // real pacing vs. cohort year (use a fixed reference for SSR, then live date after mount)
  const [now, setNow] = useState<Date>(() => new Date(2026, 5, 29));
  useEffect(() => setNow(new Date()), []);
  const pace = useMemo(
    () => computePace(profile?.cohort, plan.doneCredits, plan.reqCredits, now),
    [profile?.cohort, plan.doneCredits, plan.reqCredits, now]
  );
  const PACE_META: Record<PaceStatus, { color: string; bg: string; en: string; ar: string; icon: string }> = {
    ahead:    { color: "#156B61", bg: "#E6F2EF", en: "Ahead", ar: "متقدّم", icon: "trending_up" },
    ontrack:  { color: "#156B61", bg: "#E6F2EF", en: "On track", ar: "على المسار", icon: "trending_up" },
    slightly: { color: "#B5762E", bg: "#F6ECD7", en: "Slightly behind", ar: "متأخّر قليلاً", icon: "trending_down" },
    behind:   { color: "#B5564E", bg: "#FBECEC", en: "Behind schedule", ar: "متأخّر عن الجدول", icon: "warning" },
    new:      { color: "#2C6E91", bg: "#EAF1F7", en: "Just started", ar: "بداية جديدة", icon: "flag" },
  };
  const pm = PACE_META[pace.status];
  const paceSub = pace.status === "new"
    ? (lang === "ar" ? "أهلاً بك — لنبدأ خطتك" : "Welcome — let's build your plan")
    : (lang === "ar"
        ? `${plan.doneCredits} من ~${Math.round(pace.expectedCredits)} ساعة متوقّعة الآن`
        : `${plan.doneCredits} of ~${Math.round(pace.expectedCredits)} expected by now`);

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }} className="fade-up">
      <div>
        <div className="serif" style={{ fontSize: 30, fontWeight: 600, color: "var(--ink-strong)", lineHeight: 1.1 }}>{t.welcome}, {firstName}</div>
        <div style={{ color: "var(--muted)", marginTop: 4, fontSize: 14 }}>
          {profile?.major || "Computer Science"} · {profile?.university || "Kuwait University"} · {t.catalog} {profile?.cohort || "2023"} · GPA {gpa}
        </div>
      </div>

      {/* hero */}
      <div style={{ ...card, padding: 24, display: "flex", gap: 30, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div className="serif" style={{ fontSize: 54, fontWeight: 600, color: "#1E8378", lineHeight: 1 }}>{plan.doneCredits}</div>
            <div style={{ fontSize: 17, color: "var(--muted)", fontWeight: 500 }}>/ {plan.reqCredits} {t.credits}</div>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>{t.degreeProgress} — {plan.pct}% {t.complete}</div>
          <div style={{ marginTop: 16, height: 14, borderRadius: 8, background: "var(--track)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 8, background: "linear-gradient(90deg,#1E8378,#2A9D8F)", width: `${plan.pct}%`, transition: "width .6s ease" }} />
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 14, flexWrap: "wrap" }}>
            <div><div style={{ fontWeight: 700, fontSize: 18, color: "var(--ink-strong)" }}>{plan.remainingCredits}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{t.remaining}</div></div>
            <div style={{ width: 1, background: "var(--border)" }} />
            <div><div style={{ fontWeight: 700, fontSize: 18, color: "var(--ink-strong)" }}>{plan.semestersLeft}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{t.semestersLeft}</div></div>
          </div>
        </div>
        <div style={{ width: 1, background: "var(--border)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, justifyContent: "center", minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "#EAF1F7", display: "flex", alignItems: "center", justifyContent: "center", color: "#2C6E91" }}><Icon name="school" size={24} /></div>
            <div><div style={{ fontSize: 12, color: "var(--muted)" }}>{t.expectedGrad}</div><div className="serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--ink-strong)" }}>{plan.gradTerm}</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: pm.bg, display: "flex", alignItems: "center", justifyContent: "center", color: pm.color }}><Icon name={pm.icon} size={24} /></div>
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{t.pace}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                <span style={{ background: pm.bg, color: pm.color, fontWeight: 700, fontSize: 12, padding: "3px 9px", borderRadius: 7 }}>{lang === "ar" ? pm.ar : pm.en}</span>
                <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{paceSub}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(pace.status === "behind" || pace.status === "slightly") && (
        <div style={{ display: "flex", gap: 11, alignItems: "flex-start", background: pace.status === "behind" ? "#FBECEC" : "#F6ECD7", border: `1px solid ${pace.status === "behind" ? "#E7CFCF" : "#E8D6AE"}`, borderRadius: 13, padding: "13px 16px" }}>
          <Icon name="warning" size={20} color={pace.status === "behind" ? "#B5564E" : "#B5762E"} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "#5b4a3a", lineHeight: 1.5 }}>
            {lang === "ar"
              ? `أنت متأخّر عن وتيرة دفعتك (${profile?.cohort || ""}). أكملتِ ${plan.doneCredits} ساعة بينما المتوقّع نحو ${Math.round(pace.expectedCredits)} ساعة بحلول الآن. خذي عبئاً أكبر (≈ ١٥ ساعة/فصل) للحاق بموعد تخرجك.`
              : `You're behind your cohort's pace (${profile?.cohort || ""}). You've completed ${plan.doneCredits} credits but should be near ${Math.round(pace.expectedCredits)} by now — take a fuller load (≈15 credits/term) to catch up.`}
          </div>
        </div>
      )}

      {/* timeline */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Icon name="timeline" size={22} color="#1E8378" />
          <div className="serif" style={{ fontSize: 21, fontWeight: 600, color: "var(--ink-strong)" }}>{t.pathTitle}</div>
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18 }}>{t.pathSub}</div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14, flexWrap: "wrap", fontSize: 12, color: "var(--muted)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: "#1E8378" }} />{t.lgCompleted}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: "#6BA6CF" }} />{t.lgUpNext}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 11, height: 11, borderRadius: "50%", border: "2px solid #C3B79F", background: "var(--surface)" }} />{t.lgPlanned}</div>
        </div>

        <div style={{ overflowX: "auto", paddingBottom: 8 }}>
          <div style={{ display: "flex", gap: 0, minWidth: "max-content" }}>
            {plan.semesters.map((sem, idx) => {
              const accent = sem.isDone ? "#1E8378" : sem.next ? "#6BA6CF" : "#C3B79F";
              const summerBg = sem.isDone ? "#FCF8EF" : "#FBF6EA";
              return (
                <div key={idx} style={{ width: 172, flexShrink: 0, padding: "0 7px" }}>
                  <div style={{ position: "relative", height: 26, marginBottom: 10 }}>
                    <div style={{ position: "absolute", top: 11, insetInlineStart: 0, insetInlineEnd: 0, height: 4, background: sem.isDone ? "#1E8378" : "#D8CFBF" }} />
                    <div style={{ position: "absolute", top: 3, insetInlineStart: "50%", transform: "translateX(-50%)", width: 18, height: 18, borderRadius: "50%", background: sem.isDone ? "#1E8378" : sem.next ? "#6BA6CF" : "#fff", border: `3px solid ${sem.isDone ? "#1E8378" : sem.next ? "#6BA6CF" : "#C3B79F"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {sem.isDone && <Icon name="check" size={11} color="#fff" />}
                    </div>
                  </div>
                  <div style={{ borderRadius: 13, padding: 13, borderWidth: sem.next ? 2 : 1, borderColor: sem.next ? "#6BA6CF" : sem.summer ? "#ECDFC4" : "var(--border)", borderStyle: sem.status === "planned" ? "dashed" : "solid", background: sem.summer ? summerBg : sem.isDone ? "#fff" : sem.next ? "#F3F8FB" : "var(--surface-2)", minHeight: 150 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ink-strong)", display: "flex", alignItems: "center", gap: 4 }}>
                        {sem.summer && <Icon name="sunny" size={14} color="#C9892F" />}{sem.term}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{sem.credits} {t.cr}</span>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6, color: sem.summer ? "#B5762E" : accent, background: sem.summer ? "#F6ECD7" : sem.isDone ? "#E6F2EF" : sem.next ? "#E7F0F7" : "#F1ECE0" }}>{sem.statusLabel}</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 9 }}>
                      {sem.courses.map((c) => (
                        <div key={c.code} style={{ fontSize: 11.5, color: "var(--muted)", display: "flex", justifyContent: "space-between", gap: 6 }}>
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontStyle: c.code === "__REM__" ? "italic" : "normal", color: c.code === "__REM__" ? "#9aa6ad" : "#42525C" }}>{c.code === "__REM__" ? (lang === "ar" ? "متطلبات متبقية" : "Remaining requirements") : c.code}</span>
                          <span style={{ color: "var(--faint)", flexShrink: 0 }}>{c.cr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* graduation marker */}
            <div style={{ width: 150, flexShrink: 0, padding: "0 7px" }}>
              <div style={{ position: "relative", height: 26, marginBottom: 10 }}>
                <div style={{ position: "absolute", top: 11, insetInlineStart: 0, width: "50%", height: 4, background: "#C3B79F" }} />
                <div style={{ position: "absolute", top: 1, insetInlineStart: "50%", transform: "translateX(-50%)", width: 22, height: 22, borderRadius: "50%", background: "#102A40", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="flag" size={13} color="#fff" /></div>
              </div>
              <div style={{ background: "#102A40", borderRadius: 14, padding: 14, color: "#fff", textAlign: "center" }}>
                <Icon name="school" size={26} color="#6BA6CF" />
                <div style={{ fontWeight: 700, fontSize: 13, marginTop: 5 }}>{t.graduation}</div>
                <div className="serif" style={{ fontSize: 17, color: "#fff", marginTop: 2 }}>{plan.gradTerm}</div>
                <div style={{ fontSize: 11, color: "#9fb3c2", marginTop: 3 }}>{plan.reqCredits}/{plan.reqCredits} {t.cr}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* graduation requirements */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="verified" size={22} color="#1E8378" />
            <div className="serif" style={{ fontSize: 21, fontWeight: 600, color: "var(--ink-strong)" }}>{lang === "ar" ? "متطلبات التخرج" : "Graduation requirements"}</div>
          </div>
          <span style={{ background: eligible ? "#E6F2EF" : "var(--bg)", color: eligible ? "#156B61" : "#6E7C86", fontWeight: 700, fontSize: 12, padding: "5px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name={eligible ? "check_circle" : "pending"} size={16} />
            {eligible ? (lang === "ar" ? "مستوفى للتخرج" : "Eligible to graduate") : (lang === "ar" ? "قيد التقدّم" : "In progress")}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          {gradReqs.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", border: `1px solid ${r.met ? "#CDE6E0" : "var(--border)"}`, borderRadius: 13, background: r.met ? "#F2FAF8" : "var(--surface-2)" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: r.met ? "#E6F2EF" : "#F0EADE", color: r.met ? "#1E8378" : "#9aa6ad", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={r.met ? "check_circle" : r.icon} size={21} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{r.label}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: r.met ? "#156B61" : "#102A40" }}>{r.value}</div>
              </div>
            </div>
          ))}
        </div>
        {usingSample && (
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--faint)", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="info" size={15} />
            {lang === "ar"
              ? `الإجمالي ${total} ساعة هو الحد الأدنى لكليتك — ارفعي كشف تخصصك للحصول على تتبّع دقيق.`
              : `The ${total}-credit total is your college's minimum — upload your major sheet for exact tracking.`}
          </div>
        )}
      </div>

      {/* two column */}
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <div style={{ ...card, flex: 1, minWidth: 300 }}>
          <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "var(--ink-strong)", marginBottom: 16 }}>{t.reqCategories}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {plan.categories.map((cat, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text)" }}>{cat.label}</span>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{cat.done}/{cat.req} {t.cr}</span>
                </div>
                <div style={{ height: 8, borderRadius: 5, background: "var(--track)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 5, background: cat.color, width: `${cat.pctWidth}%`, transition: "width .6s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...card, flex: 1, minWidth: 300, display: "flex", flexDirection: "column" }}>
          <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "var(--ink-strong)" }}>{t.eligibleTitle}</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14, marginTop: 4 }}>{t.eligibleSub}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
            {elig.map((c) => (
              <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 11 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: "#E6F2EF", color: "#156B61", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{c.cr}{t.crShort}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.code} · {c.title}</div>
                  <div style={{ fontSize: 11.5, color: "#1E8378", display: "flex", alignItems: "center", gap: 4 }}><Icon name="check_circle" size={13} />{t.prereqMet}</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/courses")} style={{ marginTop: 14, background: "#102A40", color: "#fff", border: "none", borderRadius: 11, padding: 11, fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            {t.viewAllCourses}<Icon name={lang === "ar" ? "arrow_back" : "arrow_forward"} size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
