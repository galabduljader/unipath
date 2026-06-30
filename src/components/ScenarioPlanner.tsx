"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/data";
import { Icon } from "@/components/ui";
import type { CourseTuple } from "@/lib/catalog";
import { toArabicDigits } from "@/lib/catalog";
import { buildGraph, type CourseNode } from "@/lib/graph";
import { autoPlan, moveCourse, conflictsOf, creditsOf, termName, type SemPlan, type LoadPreset } from "@/lib/scenario";

const PRESETS: LoadPreset[] = [12, 15, 18];

export function ScenarioPlanner({ planCourses, total }: { planCourses: CourseTuple[]; total: number }) {
  const { lang } = useI18n();
  const { completed, scenarios, saveScenario, delScenario } = useData();
  const ar = lang === "ar";
  const num = (n: number) => (ar ? toArabicDigits(n) : String(n));

  const nodes = useMemo(() => buildGraph(planCourses, completed), [planCourses, completed]);
  const byCode = useMemo(() => new Map(nodes.map((n) => [n.code, n])), [nodes]);
  const remaining = useMemo(
    () => nodes.filter((n) => n.state !== "done").sort((a, b) => a.level - b.level || a.num - b.num || a.code.localeCompare(b.code)),
    [nodes]
  );

  const [perTerm, setPerTerm] = useState<LoadPreset>(15);
  const [summers, setSummers] = useState(false);
  const [custom, setCustom] = useState<SemPlan[] | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const base = useMemo(() => autoPlan(remaining, perTerm, summers), [remaining, perTerm, summers]);
  const sems = custom ?? base;
  const conflicts = useMemo(() => conflictsOf(sems, nodes), [sems, nodes]);
  const gradTerm = sems.length ? termName(sems[sems.length - 1].offset, ar ? "ar" : "en") : "—";
  const customized = custom !== null;

  const setPreset = (p: LoadPreset) => { setPerTerm(p); setCustom(null); };
  const toggleSummers = () => { setSummers((s) => !s); setCustom(null); };
  const move = (code: string, dir: -1 | 1) => setCustom(moveCourse(sems, code, dir, summers));
  const reset = () => setCustom(null);

  async function doSave() {
    const nm = name.trim() || (ar ? `خطة ${num(perTerm)} ساعة` : `${perTerm}-credit plan`);
    setSaving(true);
    await saveScenario({ name: nm, per_term: perTerm, summers, sems });
    setName("");
    setSaving(false);
  }

  function load(s: { per_term: number; summers: boolean; sems: { offset: number; codes: string[] }[] }) {
    setPerTerm((PRESETS.includes(s.per_term as LoadPreset) ? s.per_term : 15) as LoadPreset);
    setSummers(s.summers);
    setCustom(s.sems);
  }

  if (remaining.length === 0) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 44 }}>🎓</div>
        <div className="serif" style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-strong)", marginTop: 8 }}>{ar ? "كل المواد مكتملة!" : "Every course is done!"}</div>
        <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 4 }}>{ar ? "لا شيء لتخطيطه — تهانينا." : "Nothing left to plan — congratulations."}</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* controls */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 18px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Icon name="science" size={19} color="#2C6E91" />
          <div className="serif" style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-strong)" }}>{ar ? "ماذا لو…؟" : "What if…?"}</div>
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>{ar ? "جرّب أحمالاً مختلفة وشاهد متى تتخرّج." : "Try different loads and see when you'd graduate."}</div>

        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--faint)", marginBottom: 6 }}>{ar ? "ساعات كل فصل" : "Credits per semester"}</div>
            <div style={{ display: "flex", gap: 5, background: "var(--surface-2)", padding: 4, borderRadius: 11 }}>
              {PRESETS.map((p) => {
                const on = perTerm === p && !customized;
                return (
                  <button key={p} onClick={() => setPreset(p)} style={{ padding: "8px 15px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 700, background: on ? "#1E8378" : "transparent", color: on ? "#fff" : "var(--muted)" }}>
                    {num(p)}
                  </button>
                );
              })}
            </div>
          </div>
          <button onClick={toggleSummers} style={{ display: "flex", alignItems: "center", gap: 8, background: summers ? "#E6F2EF" : "var(--surface-2)", borderWidth: 1, borderStyle: "solid", borderColor: summers ? "#1E8378" : "var(--border)", borderRadius: 11, padding: "9px 13px", cursor: "pointer" }}>
            <Icon name={summers ? "check_box" : "check_box_outline_blank"} size={19} color={summers ? "#1E8378" : "var(--faint)"} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-strong)" }}>{ar ? "استخدم الصيف" : "Use summers"}</span>
          </button>
        </div>

        {/* outcome */}
        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <Outcome icon="event_available" label={ar ? "التخرّج المتوقّع" : "Graduate by"} value={gradTerm} hi />
          <Outcome icon="calendar_month" label={ar ? "عدد الفصول" : "Semesters"} value={num(sems.length)} />
          <Outcome icon="pending" label={ar ? "مواد متبقّية" : "Courses left"} value={num(remaining.length)} />
        </div>

        {conflicts.length > 0 && (
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 14, padding: "11px 13px", background: "#FBEEE9", borderWidth: 1, borderStyle: "solid", borderColor: "#EAD0C4", borderRadius: 11 }}>
            <Icon name="warning" size={18} color="#C0532B" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12.5, color: "#8a4a2c" }}>
              {ar ? "ترتيب غير صحيح: " : "Order issue: "}
              {conflicts.map((c, i) => (
                <span key={c.code} style={{ fontWeight: 700 }}>{c.code}{ar ? " قبل " : " before "}{c.prereq}{i < conflicts.length - 1 ? "، " : ""}</span>
              ))}
              {ar ? " — حرّك المادة لفصل لاحق." : " — move it to a later term."}
            </div>
          </div>
        )}
      </div>

      {/* semester columns */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {customized && (
          <button onClick={reset} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#2C6E91", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
            <Icon name="restart_alt" size={16} />{ar ? "العودة للخطة التلقائية" : "Reset to auto plan"}
          </button>
        )}
        {sems.map((s, idx) => {
          const cr = creditsOf(s.codes, nodes);
          const over = cr > perTerm;
          return (
            <div key={idx} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 15px", background: idx === 0 ? "#EAF1F7" : "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: idx === 0 ? "#1E8378" : "var(--surface)", color: idx === 0 ? "#fff" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700, borderWidth: idx === 0 ? 0 : 1, borderStyle: "solid", borderColor: "var(--border)" }}>{num(idx + 1)}</div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-strong)" }}>{termName(s.offset, ar ? "ar" : "en")}</span>
                  {idx === 0 && <span style={{ fontSize: 10.5, fontWeight: 700, color: "#156B61", background: "#D9EEE8", padding: "2px 7px", borderRadius: 6 }}>{ar ? "التالي" : "Up next"}</span>}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: over ? "#C0532B" : "var(--muted)" }}>{num(cr)} {ar ? "ساعة" : "cr"}</span>
              </div>
              <div style={{ padding: 11, display: "flex", flexDirection: "column", gap: 7 }}>
                {s.codes.map((code) => {
                  const n = byCode.get(code) as CourseNode | undefined;
                  return (
                    <div key={code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-strong)" }}>{code}</div>
                        <div style={{ fontSize: 11.5, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n?.title}</div>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--faint)", flexShrink: 0 }}>{num(n?.credits ?? 3)} {ar ? "ساعة" : "cr"}</span>
                      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                        <button onClick={() => move(code, -1)} disabled={idx === 0} aria-label="Earlier" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: idx === 0 ? "var(--border)" : "var(--muted)", cursor: idx === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="arrow_upward" size={16} /></button>
                        <button onClick={() => move(code, 1)} aria-label="Later" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="arrow_downward" size={16} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* save */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 15 }}>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={ar ? "اسم الخطة (مثل: المسار السريع)" : "Name this scenario (e.g. Fast track)"}
            style={{ flex: 1, minWidth: 180, border: "1px solid var(--border)", borderRadius: 11, padding: "11px 13px", fontSize: 14, outline: "none", color: "var(--text)", background: "var(--surface-2)" }}
          />
          <button onClick={doSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 7, background: "#102A40", color: "#fff", border: "none", borderRadius: 11, padding: "11px 17px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            <Icon name="bookmark_add" size={18} />{ar ? "احفظ الخطة" : "Save scenario"}
          </button>
        </div>

        {scenarios.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--faint)", marginBottom: 8 }}>{ar ? "خططك المحفوظة" : "Your saved scenarios"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {scenarios.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface-2)" }}>
                  <Icon name="bookmark" size={17} color="#2C6E91" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-strong)" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{num(s.per_term)} {ar ? "ساعة/فصل" : "cr/term"}{s.summers ? (ar ? " · مع الصيف" : " · with summers") : ""} · {num(s.sems.length)} {ar ? "فصل" : "terms"}</div>
                  </div>
                  <button onClick={() => load(s)} style={{ background: "#EAF1F7", color: "#2C6E91", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{ar ? "افتح" : "Load"}</button>
                  <button onClick={() => delScenario(s.id)} aria-label="Delete" style={{ background: "none", border: "none", color: "var(--faint)", cursor: "pointer", display: "flex", padding: 4 }}><Icon name="delete" size={17} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Outcome({ icon, label, value, hi }: { icon: string; label: string; value: string; hi?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 120, display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: 12, background: hi ? "#102A40" : "var(--surface-2)", color: hi ? "#fff" : "var(--ink-strong)" }}>
      <Icon name={icon} size={20} color={hi ? "#7FD7C8" : "#2C6E91"} />
      <div>
        <div style={{ fontSize: 10.5, opacity: hi ? 0.8 : 1, color: hi ? "#fff" : "var(--faint)" }}>{label}</div>
        <div className="serif" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      </div>
    </div>
  );
}
