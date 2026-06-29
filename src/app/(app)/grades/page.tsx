"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { Icon } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { GRADE_OPTS, computeGpaFrom, buildGradeList, resolvePlanCourses, GRAD_MIN_GPA, type GradeListItem } from "@/lib/catalog";

type GradeRow = { code: string; title: string | null; term: string | null; credits: number };

export default function GradesPage() {
  const { t, lang } = useI18n();
  const { profile, user } = useAuth();
  const { completed, grades, programCourses, setGrade, recordTakenCourse } = useData();
  const supabase = useRef(createClient()).current;
  const [gradeRows, setGradeRows] = useState<GradeRow[]>([]);
  const [refresh, setRefresh] = useState(0);

  // add-a-course form
  const [nCode, setNCode] = useState("");
  const [nTitle, setNTitle] = useState("");
  const [nCredits, setNCredits] = useState("3");
  const [nGrade, setNGrade] = useState("");

  const major = profile?.major || "Computer Science";
  const planCourses = useMemo(() => resolvePlanCourses(programCourses, major), [programCourses, major]);

  useEffect(() => {
    if (!user) return;
    supabase.from("grades").select("code, title, term, credits").eq("user_id", user.id).then(({ data }) => {
      setGradeRows((data as GradeRow[]) ?? []);
    });
  }, [user, supabase, refresh]);

  async function addCourse() {
    const code = nCode.trim().toUpperCase().replace(/\s+/g, " ");
    if (!code) return;
    await recordTakenCourse({ code, title: nTitle.trim() || code, credits: parseInt(nCredits, 10) || 3, grade: nGrade });
    setNCode(""); setNTitle(""); setNCredits("3"); setNGrade("");
    setRefresh((x) => x + 1);
  }

  const list: GradeListItem[] = useMemo(
    () => buildGradeList(completed, planCourses, gradeRows),
    [completed, planCourses, gradeRows]
  );

  const info = useMemo(
    () => computeGpaFrom(list.map((c) => ({ code: c.code, credits: c.credits })), grades),
    [list, grades]
  );
  const hasGrades = info.gradedCount > 0;
  const gpa = info.gpa.toFixed(2);
  const g = info.gpa;
  const failing = list.filter((c) => grades[c.code] === "F");

  // Standing: Good standing whenever the GPA isn't at risk; Probation (at risk) below 2.0.
  let standing: string, standingIcon: string, standingColor: string;
  if (!hasGrades) { standing = lang === "ar" ? "لا توجد درجات بعد" : "Not graded yet"; standingIcon = "hourglass_empty"; standingColor = "#9aa6ad"; }
  else if (g >= 3.75) { standing = t.deansList; standingIcon = "workspace_premium"; standingColor = "#E6B94D"; }
  else if (g >= 2.0) { standing = t.goodStanding; standingIcon = "verified"; standingColor = "#6BD3A8"; }
  else { standing = lang === "ar" ? "إنذار أكاديمي" : "At risk"; standingIcon = "warning"; standingColor = "#E08A6E"; }

  const toDean = (3.75 - g).toFixed(2);
  const insight = !hasGrades
    ? (lang === "ar"
        ? "أضِف درجاتك للمواد المكتملة أدناه ليُحسب معدّلك التراكمي الحقيقي تلقائياً."
        : "Add grades to your completed courses below and your real cumulative GPA is calculated automatically.")
    : lang === "ar"
    ? `معدّلك ${gpa} على ${info.credits} ساعة محتسبة. ${g >= 3.75 ? "أنت على قائمة الشرف — واصلي التميّز." : g >= 2.0 ? `وضعك جيد ولست في خطر. تبعدين ${toDean} نقطة عن قائمة الشرف (٣٫٧٥).` : "معدّلك دون ٢٫٠ — أنت في خطر أكاديمي؛ ركّزي على رفع الدرجات هذا الفصل."}`
    : `You're carrying a ${gpa} GPA across ${info.credits} graded credits. ${g >= 3.75 ? "You're on the Dean's List — keep it up." : g >= 2.0 ? `You're in good standing and not at risk. You're ${toDean} points from the Dean's List (3.75).` : "Your GPA is below 2.0 — you're academically at risk; focus on lifting grades this term."}`;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }} className="fade-up">
      <div style={{ background: "#102A40", borderRadius: 18, padding: 24, color: "#fff", display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12.5, color: "#9fb3c2" }}>{t.cumGpa}</div>
          <div className="serif" style={{ fontSize: 56, fontWeight: 600, lineHeight: 1, color: "#fff" }}>{hasGrades ? gpa : "—"}</div>
          <div style={{ fontSize: 12, color: "#6BA6CF", marginTop: 4 }}>{t.gpaScale}</div>
          <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600, padding: "4px 9px", borderRadius: 7, background: hasGrades ? (g >= GRAD_MIN_GPA ? "rgba(107,211,168,.18)" : "rgba(224,138,110,.2)") : "rgba(255,255,255,.1)", color: hasGrades ? (g >= GRAD_MIN_GPA ? "#8fe3c0" : "#f0b9a6") : "#9fb3c2" }}>
            <Icon name={!hasGrades ? "info" : g >= GRAD_MIN_GPA ? "check_circle" : "warning"} size={14} />
            {lang === "ar" ? `حد التخرج: ٢٫٠ ${hasGrades ? (g >= GRAD_MIN_GPA ? "— مستوفى" : "— غير مستوفى") : ""}` : `Graduation minimum 2.0${hasGrades ? (g >= GRAD_MIN_GPA ? " — met" : " — not met") : ""}`}
          </div>
        </div>
        <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,.12)" }} />
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap" }}>
          <div><div className="serif" style={{ fontSize: 24 }}>{info.credits}</div><div style={{ fontSize: 12, color: "#9fb3c2" }}>{t.gradedCredits}</div></div>
          <div><div className="serif" style={{ fontSize: 24 }}>{info.points.toFixed(1)}</div><div style={{ fontSize: 12, color: "#9fb3c2" }}>{t.qualityPoints}</div></div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}><Icon name={standingIcon} size={21} color={standingColor} /><span className="serif" style={{ fontSize: 20, whiteSpace: "nowrap" }}>{standing}</span></div>
            <div style={{ fontSize: 12, color: "#9fb3c2" }}>{t.standing}</div>
          </div>
        </div>
      </div>

      {failing.length > 0 && (
        <div style={{ display: "flex", gap: 11, alignItems: "flex-start", background: "#FBECEC", border: "1px solid #E7CFCF", borderRadius: 13, padding: "14px 16px" }}>
          <Icon name="warning" size={20} color="#B5564E" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "#8a3b34", lineHeight: 1.5 }}>
            {lang === "ar"
              ? `لديك ${failing.length} مادة راسبة (${failing.map((c) => c.code).join("، ")}). تُحتسب درجة F بصفر (٠٫٠) وتخفض معدّلك التراكمي — أعِد المادة لتحسين المعدّل.`
              : `You have ${failing.length} failing grade${failing.length > 1 ? "s" : ""} (${failing.map((c) => c.code).join(", ")}). An F counts as 0.0 and is dragging your GPA down — retake the course to replace it.`}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 11, alignItems: "flex-start", background: "#EAF1F7", border: "1px solid #D5E3EC", borderRadius: 13, padding: "14px 16px" }}>
        <Icon name="auto_awesome" size={20} color="#2C6E91" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: "#2b4b5e", lineHeight: 1.5 }}>{insight}</div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "var(--ink-strong)" }}>{t.yourGrades}</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{lang === "ar" ? "أضِف المواد التي أخذتها وحدّد درجاتها." : "Add the courses you've taken and set their grades."}</div>
        </div>

        {/* add a course you took */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input value={nCode} onChange={(e) => setNCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCourse()} placeholder={lang === "ar" ? "الرمز (CS 350)" : "Code (CS 350)"} style={{ width: 120, border: "1px solid var(--border)", borderRadius: 9, padding: "9px 11px", fontSize: 13, outline: "none", background: "var(--surface)", color: "var(--text)" }} />
          <input value={nTitle} onChange={(e) => setNTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCourse()} placeholder={lang === "ar" ? "اسم المادة (اختياري)" : "Course title (optional)"} style={{ flex: 1, minWidth: 150, border: "1px solid var(--border)", borderRadius: 9, padding: "9px 11px", fontSize: 13, outline: "none", background: "var(--surface)", color: "var(--text)" }} />
          <input value={nCredits} onChange={(e) => setNCredits(e.target.value.replace(/\D/g, "").slice(0, 1))} placeholder={lang === "ar" ? "ساعات" : "Cr"} title={lang === "ar" ? "الساعات" : "Credits"} style={{ width: 64, border: "1px solid var(--border)", borderRadius: 9, padding: "9px 11px", fontSize: 13, outline: "none", background: "var(--surface)", color: "var(--text)" }} />
          <select value={nGrade} onChange={(e) => setNGrade(e.target.value)} style={{ width: 90, border: "1px solid var(--border)", borderRadius: 9, padding: "9px 11px", fontSize: 13, fontWeight: 700, outline: "none", background: "var(--surface)", color: nGrade ? "#102A40" : "#9aa6ad" }}>
            <option value="">{lang === "ar" ? "الدرجة" : "Grade"}</option>
            {GRADE_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <button onClick={addCourse} style={{ background: "#1E8378", color: "#fff", border: "none", borderRadius: 9, padding: "9px 15px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><Icon name="add" size={17} />{lang === "ar" ? "أضف" : "Add"}</button>
        </div>
        {list.length === 0 ? (
          <div style={{ padding: 36, textAlign: "center", color: "var(--faint)", fontSize: 13 }}>
            {lang === "ar" ? "لم تُضف أي مواد بعد — استخدم النموذج أعلاه لإضافة المواد التي أخذتها." : "No courses yet — use the form above to add the courses you've taken."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 560 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr .9fr .5fr .7fr", gap: 12, padding: "11px 20px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", fontSize: 11.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>
                <div>{t.colCourse}</div><div>{t.term}</div><div>{t.cr}</div><div style={{ textAlign: "end" }}>{t.grade}</div>
              </div>
              {list.map((c) => (
                <div key={c.code} style={{ display: "grid", gridTemplateColumns: "1.6fr .9fr .5fr .7fr", gap: 12, padding: "10px 20px", borderBottom: "1px solid #F0EADE", alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink-strong)" }}>{c.code}</div><div style={{ fontSize: 12, color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div></div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{c.term || "—"}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{c.credits}</div>
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <select value={grades[c.code] ?? ""} onChange={(e) => setGrade(c.code, e.target.value)} style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "7px 10px", fontSize: 13, fontWeight: 700, color: grades[c.code] ? "#102A40" : "#9aa6ad", background: "var(--surface-2)", outline: "none" }}>
                      <option value="">—</option>
                      {GRADE_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
