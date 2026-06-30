"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { Icon } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { coursesForMajor, computePlan, programTotalCredits, type CourseTuple } from "@/lib/catalog";
import { PARSE_STAGES } from "@/lib/content";
import { parseSheet, type ExtractedCourse } from "@/lib/parseSheet";
import { pop } from "@/lib/celebrate";
import { MajorMap } from "@/components/MajorMap";

const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 30 };

export default function UploadPage() {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const { completed, toggleCompleted, setProgramCourses } = useData();
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("CS_Degree_Plan_2023.pdf");
  const [fileSize, setFileSize] = useState("1.8 MB");
  const [fileError, setFileError] = useState("");
  const [extracted, setExtracted] = useState<ExtractedCourse[]>([]);
  const [fromFile, setFromFile] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const major = profile?.major || "Computer Science";
  const msg = (en: string, ar: string) => (lang === "ar" ? ar : en);

  // joyful confetti the moment the simplified plan is revealed
  useEffect(() => { if (step === 2) { const id = setTimeout(() => pop(), 250); return () => clearTimeout(id); } }, [step]);

  // journey map data from the parsed courses
  const journeyTuples = useMemo<CourseTuple[]>(() => extracted.map((c) => [c.code, c.title, c.title, c.credits]), [extracted]);
  const upTotal = useMemo(() => programTotalCredits(major, extracted), [major, extracted]);
  const upPlan = useMemo(() => computePlan(journeyTuples, completed, lang, t, upTotal), [journeyTuples, completed, lang, t, upTotal]);
  const fmtSize = (b: number) => (b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : b >= 1024 ? Math.round(b / 1024) + " KB" : b + " B");

  function animateTo(target: number) {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setProgress((p) => (p >= target ? (clearInterval(timer.current!), p) : p + 6)), 90);
  }

  const catalogList = (): ExtractedCourse[] =>
    coursesForMajor(major).map((c) => ({ code: c[0], title: lang === "ar" ? c[2] : c[1], credits: c[3] }));

  async function runParse(file: File | null) {
    setStep(1); setProgress(8); animateTo(90);
    let courses: ExtractedCourse[] = [];
    if (file) {
      courses = await parseSheet(file);
      if (user) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        supabase.storage.from("degree-sheets").upload(path, file).then(({ error }) => {
          if (!error) supabase.from("documents").insert({ user_id: user.id, file_name: file.name, file_size: fmtSize(file.size), storage_path: path }).then(() => {});
        });
      }
    }
    const good = courses.length >= 3;
    const list = good ? courses : catalogList();
    setExtracted(list);
    setFromFile(good);
    if (good) await setProgramCourses(list);
    if (timer.current) clearInterval(timer.current);
    setProgress(100);
    setTimeout(() => setStep(2), 450);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    const okExt = /\.(pdf|docx?)$/i.test(file.name);
    if (!(/pdf|word|officedocument|msword/.test(file.type) || okExt)) return setFileError(msg("Please choose a PDF or DOCX file.", "يرجى اختيار ملف PDF أو DOCX."));
    if (file.size > 10 * 1048576) return setFileError(msg("File is over the 10MB limit.", "حجم الملف يتجاوز ١٠ ميجابايت."));
    setFileName(file.name); setFileSize(fmtSize(file.size)); setFileError("");
    runParse(file);
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }} className="fade-up">
      {step === 0 && (
        <div style={card}>
          <div className="serif" style={{ fontSize: 24, fontWeight: 600, color: "var(--ink-strong)" }}>{t.upTitle}</div>
          <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 5, marginBottom: 22 }}>{t.upSub}</div>
          <div style={{ border: "2px dashed #C3D3DD", borderRadius: 16, background: "var(--surface-2)", padding: "40px 24px", textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: "#EAF1F7", color: "#2C6E91", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><Icon name="upload_file" size={30} /></div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink-strong)" }}>{t.dropHere}</div>
            <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 5 }}>{t.constraints}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
              <input ref={fileInput} type="file" accept=".pdf,.doc,.docx" onChange={onPick} style={{ display: "none" }} />
              <button onClick={() => fileInput.current?.click()} style={{ background: "#1E8378", color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", gap: 7 }}><Icon name="description" size={18} />{t.browse}</button>
              <button onClick={() => { setFileName("CS_Degree_Plan_2023.pdf"); setFileSize("1.8 MB"); setFileError(""); runParse(null); }} style={{ background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 18px", fontWeight: 600, fontSize: 13.5 }}>{t.useSample}</button>
            </div>
            {fileError && <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 7, background: "#FBECEC", border: "1px solid #E7CFCF", color: "#B5564E", borderRadius: 9, padding: "8px 12px", fontSize: 12.5 }}><Icon name="error" size={16} />{fileError}</div>}
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 18, flexWrap: "wrap" }}>
            {[{ icon: "fact_check", text: t.uStep1 }, { icon: "account_tree", text: t.uStep2 }, { icon: "event", text: t.uStep3 }].map((u, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, color: "var(--muted)" }}><Icon name={u.icon} size={18} color="#1E8378" />{u.text}</div>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 24 }}>
            <Icon name="picture_as_pdf" size={26} color="#C9512F" />
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)" }}>{fileName}</div><div style={{ fontSize: 11.5, color: "var(--faint)" }}>{fileSize}</div></div>
            <div className="spin" style={{ width: 30, height: 30, border: "3px solid #E6F2EF", borderTopColor: "#1E8378", borderRadius: "50%" }} />
          </div>
          <div className="serif" style={{ fontSize: 21, fontWeight: 600, color: "var(--ink-strong)" }}>{t.parsing}</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, marginBottom: 20 }}>{t.parseSub}</div>
          <div style={{ height: 10, borderRadius: 6, background: "var(--track)", overflow: "hidden", marginBottom: 22 }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg,#1E8378,#2A9D8F)", borderRadius: 6, transition: "width .2s ease", width: `${progress}%` }} />
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

      {step === 2 && (
        <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* joyful headline */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 6 }}>✨</div>
            <div className="serif" style={{ fontSize: 25, fontWeight: 600, color: "var(--ink-strong)" }}>
              {msg("Ta-da! Your major map is ready", "تـمّ! خريطة تخصّصك جاهزة")}
            </div>
            <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 6, maxWidth: 460, marginInline: "auto", lineHeight: 1.55 }}>
              {fromFile
                ? msg("We turned that long, confusing sheet into a clear, friendly map. Take a breath — you've got this. 🌱", "حوّلنا الكشف الطويل والمربك إلى خريطة واضحة وودودة. خُذي نفساً — أنتِ قادرة. 🌱")
                : msg("Here's a clear, friendly map of your degree. Take a breath — you've got this. 🌱", "هذه خريطة واضحة وودودة لدرجتك. خُذي نفساً — أنتِ قادرة. 🌱")}
            </div>
          </div>

          {/* the creative major map — the immediate result of uploading */}
          <MajorMap major={major} planCourses={journeyTuples} completed={completed} gradTerm={upPlan.gradTerm} total={upTotal} />

          {/* refine: tick what you've done — updates the map above live */}
          <div style={card}>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)", marginBottom: 4 }}>{msg("Tick what you've already done 👇", "علّمي ما أنجزتِه 👇")}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{msg("Your map above fills in as you check them off.", "تمتلئ خريطتك بالأعلى كلما علّمتِ المواد.")}</div>
            <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 7, border: "1px solid var(--border)", borderRadius: 12, padding: 10 }}>
              {extracted.map((c) => {
                const on = completed.has(c.code);
                return (
                  <button key={c.code} onClick={() => toggleCompleted(c.code)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", border: `1px solid ${on ? "#CDE6E0" : "#EEE8DC"}`, borderRadius: 9, background: on ? "#F2FAF8" : "var(--surface)", width: "100%" }}>
                    <Icon name={on ? "check_circle" : "radio_button_unchecked"} size={20} color={on ? "#1E8378" : "#cdd5d9"} />
                    <span style={{ flex: 1, textAlign: "start", fontSize: 13, color: "var(--text)" }}>{c.code} · {c.title}</span>
                    <span style={{ fontSize: 11.5, color: "var(--faint)" }}>{c.credits} {t.cr}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => router.push("/courses")} style={{ marginTop: 16, width: "100%", background: "linear-gradient(135deg,#1E8378,#2C6E91)", color: "#fff", border: "none", borderRadius: 12, padding: 13, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon name="account_tree" size={19} />{msg("Explore my interactive map", "استكشف خريطتي التفاعلية")}
            </button>
            <button onClick={() => router.push("/dashboard")} style={{ marginTop: 9, width: "100%", background: "var(--surface-2)", color: "var(--ink-strong)", border: "1px solid var(--border)", borderRadius: 12, padding: 13, fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon name="check_circle" size={19} />{t.looksGood}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
