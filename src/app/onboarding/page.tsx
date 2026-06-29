"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useI18n, langSwitchLabel } from "@/lib/i18n";
import { Icon, Logo } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { UNIVERSITIES, MAJORS, COHORTS, coursesForMajor } from "@/lib/catalog";
import { PARSE_STAGES } from "@/lib/content";
import { parseSheet, type ExtractedCourse } from "@/lib/parseSheet";

const selStyle: React.CSSProperties = {
  width: "100%", border: "1px solid #E7E0D3", borderRadius: 11, padding: "12px 14px",
  fontSize: 14, outline: "none", color: "#15324B", background: "#FBFAF6",
};
const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: "#42525C", marginBottom: 7, display: "block" };

export default function OnboardingPage() {
  const { t, lang, toggleLang } = useI18n();
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [step, setStep] = useState(0);
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [cohort, setCohort] = useState("");
  const [fileName, setFileName] = useState("CS_Degree_Plan_2023.pdf");
  const [fileSize, setFileSize] = useState("1.8 MB");
  const [fileError, setFileError] = useState("");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [extracted, setExtracted] = useState<ExtractedCourse[]>([]);
  const [fromFile, setFromFile] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const parseTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (profile?.onboarded) router.replace("/dashboard");
  }, [user, profile, loading, router]);

  const catalogList = (): ExtractedCourse[] =>
    (major ? coursesForMajor(major) : []).map((c) => ({ code: c[0], title: lang === "ar" ? c[2] : c[1], credits: c[3] }));
  const reviewCourses: ExtractedCourse[] = fromFile && extracted.length ? extracted : catalogList();

  const groups = [t.obProfile, t.obCohortStep, t.obUploadStep, t.obCoursesStep];
  const curGroup = step <= 0 ? 0 : step === 1 ? 1 : step === 2 || step === 3 ? 2 : 3;
  const msg = (en: string, ar: string) => (lang === "ar" ? ar : en);

  function validate(file: File): boolean {
    const okExt = /\.(pdf|docx?)$/i.test(file.name);
    const okType = /pdf|word|officedocument|msword/.test(file.type) || okExt;
    if (!okType) { setFileError(msg("Please choose a PDF or DOCX file.", "يرجى اختيار ملف PDF أو DOCX.")); return false; }
    if (file.size > 10 * 1048576) { setFileError(msg("File is over the 10MB limit.", "حجم الملف يتجاوز ١٠ ميجابايت.")); return false; }
    return true;
  }
  function fmtSize(b: number) {
    if (b >= 1048576) return (b / 1048576).toFixed(1) + " MB";
    if (b >= 1024) return Math.round(b / 1024) + " KB";
    return b + " B";
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!validate(file)) return;
    setFileName(file.name);
    setFileSize(fmtSize(file.size));
    setFileError("");
    if (user) {
      const path = `${user.id}/${Date.now()}-${file.name}`;
      supabase.storage.from("degree-sheets").upload(path, file, { upsert: false }).then(({ error }) => {
        if (!error) supabase.from("documents").insert({ user_id: user.id, file_name: file.name, file_size: fmtSize(file.size), storage_path: path }).then(() => {});
      });
    }
    runParse(file);
  }

  async function runParse(file: File | null) {
    setStep(3);
    setProgress(6);
    if (parseTimer.current) clearInterval(parseTimer.current);
    parseTimer.current = setInterval(() => setProgress((p) => Math.min(p + 6, 90)), 80);
    let courses: ExtractedCourse[] = [];
    if (file) courses = await parseSheet(file);
    const good = courses.length >= 3;
    setExtracted(good ? courses : []);
    setFromFile(good);
    if (parseTimer.current) clearInterval(parseTimer.current);
    setProgress(100);
    setTimeout(() => setStep(4), 450);
  }

  function toggleDone(code: string) {
    setDone((prev) => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n; });
  }

  async function finish() {
    if (!user) return;
    await supabase.from("profiles").update({
      university: university || "Kuwait University",
      major: major || "Computer Science",
      cohort: cohort || "2023",
      onboarded: true,
    }).eq("id", user.id);
    const codes = [...done];
    await supabase.from("completed_courses").delete().eq("user_id", user.id);
    if (codes.length) await supabase.from("completed_courses").insert(codes.map((code) => ({ user_id: user.id, code })));
    // persist the courses read from the uploaded sheet as the student's program
    await supabase.from("program_courses").delete().eq("user_id", user.id);
    if (fromFile && extracted.length)
      await supabase.from("program_courses").insert(
        extracted.map((c, i) => ({ user_id: user.id, code: c.code, title: c.title, credits: c.credits, sort: i }))
      );
    await refreshProfile();
    router.replace("/dashboard");
  }

  const obDoneCount = reviewCourses.filter((c) => done.has(c.code)).length;
  const obDoneCredits = reviewCourses.filter((c) => done.has(c.code)).reduce((a, c) => a + c.credits, 0);
  const obCountLabel = lang === "ar"
    ? `${obDoneCount} من ${reviewCourses.length} مادة · ${obDoneCredits} ساعة`
    : `${obDoneCount} of ${reviewCourses.length} courses · ${obDoneCredits} credits`;

  const canNext = step === 0 ? !!(university && major) : step === 1 ? !!cohort : true;

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#F4EEE3", overflowY: "auto", display: "flex", justifyContent: "center", padding: "26px 18px 40px" }}>
      <div style={{ width: "100%", maxWidth: 660 }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <Logo size={36} radius={10} textSize={17} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={toggleLang} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #E7E0D3", borderRadius: 9, padding: "7px 11px", color: "#15324B", fontWeight: 600, fontSize: 12.5 }}>
              <Icon name="translate" size={17} />{langSwitchLabel(lang)}
            </button>
            <button onClick={async () => { await signOut(); router.replace("/login"); }} style={{ background: "#fff", border: "1px solid #E7E0D3", borderRadius: 9, padding: "7px 11px", color: "#6E7C86", fontWeight: 600, fontSize: 12.5 }}>{t.signOut}</button>
          </div>
        </div>

        {/* progress */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22 }}>
          {groups.map((label, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, textAlign: "center" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, ...(i < curGroup ? { background: "#1E8378", color: "#fff" } : i === curGroup ? { background: "#102A40", color: "#fff" } : { background: "#EDE6D8", color: "#9aa6ad" }) }}>
                {i < curGroup ? <Icon name="check" size={17} /> : i + 1}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: i === curGroup ? 700 : 500, color: i <= curGroup ? "#102A40" : "#9aa6ad" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* card */}
        <div style={{ background: "#fff", border: "1px solid #E7E0D3", borderRadius: 18, padding: 30 }}>
          {step === 0 && (
            <div className="fade-up">
              <div className="serif" style={{ fontSize: 24, fontWeight: 600, color: "#102A40" }}>{t.obProfileTitle}</div>
              <div style={{ fontSize: 13.5, color: "#6E7C86", marginTop: 5, marginBottom: 24 }}>{t.obProfileSub}</div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>{t.chooseUniversity}</label>
                <select value={university} onChange={(e) => setUniversity(e.target.value)} style={selStyle}>
                  <option value="">{t.selectOpt}</option>
                  {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t.chooseMajor}</label>
                <select value={major} onChange={(e) => setMajor(e.target.value)} style={selStyle}>
                  <option value="">{t.selectOpt}</option>
                  {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="fade-up">
              <div className="serif" style={{ fontSize: 24, fontWeight: 600, color: "#102A40" }}>{t.obCohortTitle}</div>
              <div style={{ fontSize: 13.5, color: "#6E7C86", marginTop: 5, marginBottom: 22 }}>{t.obCohortSub}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {COHORTS.map((c) => (
                  <button key={c} onClick={() => setCohort(c)} style={{ border: `2px solid ${cohort === c ? "#1E8378" : "#E7E0D3"}`, background: cohort === c ? "#E6F2EF" : "#fff", borderRadius: 13, padding: "18px 14px", textAlign: "center" }}>
                    <div className="serif" style={{ fontSize: 24, fontWeight: 600, color: cohort === c ? "#156B61" : "#102A40" }}>{c}</div>
                    <div style={{ fontSize: 11, color: "#9aa6ad", marginTop: 2 }}>{t.cohortHint}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-up">
              <div className="serif" style={{ fontSize: 24, fontWeight: 600, color: "#102A40" }}>{t.obUploadTitle}</div>
              <div style={{ fontSize: 13.5, color: "#6E7C86", marginTop: 5, marginBottom: 22 }}>{t.obUploadSub}</div>
              <div style={{ border: "2px dashed #C3D3DD", borderRadius: 16, background: "#F7FAFB", padding: "36px 24px", textAlign: "center" }}>
                <div style={{ width: 58, height: 58, borderRadius: 15, background: "#EAF1F7", color: "#2C6E91", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <Icon name="upload_file" size={29} />
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#102A40" }}>{t.dropHere}</div>
                <div style={{ fontSize: 12.5, color: "#9aa6ad", marginTop: 5 }}>{t.constraints}</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
                  <input ref={fileInput} type="file" accept=".pdf,.doc,.docx" onChange={onPick} style={{ display: "none" }} />
                  <button onClick={() => fileInput.current?.click()} style={{ background: "#1E8378", color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", gap: 7 }}>
                    <Icon name="description" size={18} />{t.browse}
                  </button>
                  <button onClick={() => { setFileName("CS_Degree_Plan_2023.pdf"); setFileSize("1.8 MB"); setFileError(""); runParse(null); }} style={{ background: "#fff", color: "#15324B", border: "1px solid #E7E0D3", borderRadius: 10, padding: "11px 18px", fontWeight: 600, fontSize: 13.5 }}>{t.useSample}</button>
                </div>
                {fileError && (
                  <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, background: "#FBECEC", border: "1px solid #E7CFCF", color: "#B5564E", borderRadius: 9, padding: "8px 12px", fontSize: 12.5 }}>
                    <Icon name="error" size={16} />{fileError}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-up">
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", border: "1px solid #E7E0D3", borderRadius: 12, marginBottom: 24 }}>
                <Icon name="picture_as_pdf" size={26} color="#C9512F" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: "#102A40" }}>{fileName}</div>
                  <div style={{ fontSize: 11.5, color: "#9aa6ad" }}>{fileSize}</div>
                </div>
                <div className="spin" style={{ width: 30, height: 30, border: "3px solid #E6F2EF", borderTopColor: "#1E8378", borderRadius: "50%" }} />
              </div>
              <div className="serif" style={{ fontSize: 21, fontWeight: 600, color: "#102A40" }}>{t.parsing}</div>
              <div style={{ fontSize: 13, color: "#6E7C86", marginTop: 4, marginBottom: 20 }}>{t.parseSub}</div>
              <div style={{ height: 10, borderRadius: 6, background: "#EEF1F0", overflow: "hidden", marginBottom: 22 }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg,#1E8378,#2A9D8F)", borderRadius: 6, transition: "width .15s ease", width: `${progress}%` }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {PARSE_STAGES(lang).map((s, i) => {
                  const active = progress >= s.th, doing = progress >= s.th - 20 && progress < s.th;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <Icon name={active ? "check_circle" : "radio_button_unchecked"} size={21} color={active ? "#1E8378" : doing ? "#6BA6CF" : "#cdd5d9"} />
                      <span style={{ fontSize: 13.5, color: active ? "#102A40" : "#9aa6ad", fontWeight: active || doing ? 600 : 400 }}>{s.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="fade-up">
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Icon name="fact_check" size={23} color="#1E8378" />
                <div className="serif" style={{ fontSize: 23, fontWeight: 600, color: "#102A40" }}>{t.obCoursesTitle}</div>
              </div>
              <div style={{ fontSize: 13, color: "#6E7C86", marginTop: 5, marginBottom: 14 }}>{t.obCoursesSub}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#EAF1F7", color: "#2C6E91", border: "1px solid #D5E3EC", borderRadius: 9, padding: "7px 12px", fontSize: 12.5, fontWeight: 600 }}>
                  <Icon name="school" size={16} />{major}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#156B61" }}>{obCountLabel}</span>
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 7, border: "1px solid #E7E0D3", borderRadius: 12, padding: 10 }}>
                {reviewCourses.map((c) => {
                  const on = done.has(c.code);
                  return (
                    <button key={c.code} onClick={() => toggleDone(c.code)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", border: `1px solid ${on ? "#CDE6E0" : "#EEE8DC"}`, borderRadius: 9, background: on ? "#F2FAF8" : "#fff", width: "100%" }}>
                      <Icon name={on ? "check_circle" : "radio_button_unchecked"} size={20} color={on ? "#1E8378" : "#cdd5d9"} />
                      <span style={{ flex: 1, textAlign: "start", fontSize: 13, color: "#2b3a44" }}>{c.code} · {c.title}</span>
                      <span style={{ fontSize: 11.5, color: "#9aa6ad" }}>{c.credits} {t.cr}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* nav buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
          {step === 1 || step === 2 || step === 4 ? (
            <button onClick={() => setStep(step === 4 ? 2 : step - 1)} style={{ background: "#fff", color: "#42525C", border: "1px solid #E7E0D3", borderRadius: 11, padding: "12px 20px", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name={lang === "ar" ? "arrow_forward" : "arrow_back"} size={18} />{t.back}
            </button>
          ) : <span />}

          {step === 0 || step === 1 ? (
            <button onClick={() => canNext && setStep(step + 1)} disabled={!canNext} style={{ background: canNext ? "#1E8378" : "#cfd8d6", color: "#fff", border: "none", borderRadius: 11, padding: "12px 22px", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 7, cursor: canNext ? "pointer" : "not-allowed" }}>
              {t.next}<Icon name={lang === "ar" ? "arrow_back" : "arrow_forward"} size={18} />
            </button>
          ) : step === 4 ? (
            <button onClick={finish} style={{ background: "#1E8378", color: "#fff", border: "none", borderRadius: 11, padding: "12px 22px", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>
              <Icon name="check_circle" size={18} />{t.finish}
            </button>
          ) : <span />}
        </div>
      </div>
    </div>
  );
}
