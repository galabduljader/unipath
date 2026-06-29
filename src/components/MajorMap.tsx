"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { Icon, useIsMobile } from "@/components/ui";
import { buildJourney, deptOf, type CourseTuple, type JourneyState } from "@/lib/catalog";
import { getMajorProfile, pick } from "@/lib/majorProfiles";

const PHASES: Record<number, { en: string; ar: string }> = {
  1: { en: "Build your foundation", ar: "ابنِ أساسك" },
  2: { en: "Explore & connect", ar: "استكشف وتواصل" },
  3: { en: "Specialize & grow", ar: "تخصّص وانمُ" },
  4: { en: "Apply & make impact", ar: "طبّق وأحدث أثراً" },
};

const STATE_ICON: Record<JourneyState, string> = { done: "check_circle", available: "play_circle", locked: "lock" };

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
      <div style={{ display: "inline-block", fontWeight: 700, fontSize: 12.5, letterSpacing: ".06em", textTransform: "uppercase", color: "#fff", background: accent, borderRadius: 8, padding: "4px 10px", marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

export function MajorMap({
  major,
  planCourses,
  completed,
  gradTerm,
  total,
}: {
  major: string;
  planCourses: CourseTuple[];
  completed: Set<string>;
  gradTerm: string;
  total: number;
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const isMobile = useIsMobile();
  const stages = useMemo(() => buildJourney(planCourses, completed), [planCourses, completed]);
  const profile = getMajorProfile(major);

  const doneCredits = useMemo(
    () => [...completed].reduce((a, code) => { const t = planCourses.find((c) => c[0] === code); return a + (t ? t[3] : 3); }, 0),
    [completed, planCourses]
  );
  const pct = total ? Math.min(100, Math.round((doneCredits / total) * 100)) : 0;

  // legend = departments present
  const depts = useMemo(() => {
    const seen = new Map<string, { label: string; color: string }>();
    for (const c of planCourses) { const p = c[0].split(" ")[0]; if (!seen.has(p)) { const d = deptOf(c[0], lang); seen.set(p, { label: d.label, color: d.color }); } }
    return [...seen.values()];
  }, [planCourses, lang]);

  const ringC = 2 * Math.PI * 26;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ===== hero ===== */}
      <div style={{ position: "relative", background: "linear-gradient(135deg, #EEE7F4, #EAF1F7)", border: "1px solid var(--border)", borderRadius: 18, padding: "22px 20px", overflow: "hidden", textAlign: "center" }}>
        <span style={{ position: "absolute", top: 14, insetInlineStart: 18, fontSize: 18, opacity: .8 }}>✦</span>
        <span style={{ position: "absolute", top: 30, insetInlineEnd: 26, fontSize: 22, opacity: .7 }}>⭐</span>
        <span style={{ position: "absolute", bottom: 16, insetInlineStart: 40, fontSize: 14, opacity: .6 }}>✦</span>
        <div className="serif" style={{ fontSize: 30, fontWeight: 600, color: "#5B3FA8", lineHeight: 1.05 }}>{ar ? "خريطة تخصّصي" : "My Major Map"}</div>
        <div style={{ display: "inline-block", marginTop: 8, background: "#7A5AA8", color: "#fff", fontWeight: 600, fontSize: 13, padding: "5px 13px", borderRadius: 20 }}>{major}</div>
        <div style={{ fontSize: 13.5, color: "#5a4d6e", marginTop: 10, maxWidth: 420, marginInline: "auto", lineHeight: 1.5 }}>{pick(profile.tagline, lang)} 💜</div>
      </div>

      {/* ===== what is + progress (side by side on desktop) ===== */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 240, background: "#102A40", color: "#fff", borderRadius: 16, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="lightbulb" size={20} color="#E6B94D" />
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: ".04em" }}>{ar ? `ما هو ${major}؟` : `What is ${major}?`}</div>
          </div>
          <div style={{ fontSize: 13.5, color: "#cdd9e2", lineHeight: 1.6 }}>{pick(profile.whatIs, lang)}</div>
        </div>
        <div style={{ flex: 1, minWidth: 200, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
            <circle cx="32" cy="32" r="26" fill="none" stroke="var(--track)" strokeWidth="8" />
            <circle cx="32" cy="32" r="26" fill="none" stroke="#7A5AA8" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(pct / 100) * ringC} ${ringC}`} transform="rotate(-90 32 32)" />
            <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink-strong)">{pct}%</text>
          </svg>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink-strong)" }}>{ar ? "تتبّع رحلتك" : "Progress tracker"}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{doneCredits} / {total} {ar ? "ساعة" : "credits"}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{ar ? "الوجهة:" : "Destination:"} <span style={{ color: "var(--ink-strong)", fontWeight: 600 }}>{gradTerm}</span></div>
          </div>
        </div>
      </div>

      {/* ===== academic journey ===== */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: isMobile ? 14 : 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
          <div className="serif" style={{ fontSize: 21, fontWeight: 600, color: "var(--ink-strong)" }}>{ar ? "رحلتك الأكاديمية" : "Your academic journey"}</div>
          <span style={{ fontSize: 20 }}>🚀</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 16 }}>
          {ar ? "كل محطة مادة — أكملها لتفتح ما بعدها وتصل للكنز 🏆" : "Each station is a course — clear it to unlock what's next and reach the treasure 🏆"}
        </div>

        {stages.map((stage, si) => {
          const phase = PHASES[stage.level];
          const allDone = stage.courses.every((c) => c.state === "done");
          return (
            <div key={stage.level} style={{ display: "flex", gap: 14, marginBottom: 18, flexWrap: isMobile ? "wrap" : "nowrap", alignItems: "flex-start" }}>
              {/* year label */}
              <div style={{ width: isMobile ? "100%" : 92, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--faint)" }}>{ar ? "السنة" : "YEAR"}</span>
                  <span className="serif" style={{ fontSize: 30, fontWeight: 600, color: allDone ? "#1E8378" : "#7A5AA8", lineHeight: 1 }}>{ar ? ["", "١", "٢", "٣", "٤"][stage.level] : stage.level}</span>
                  {allDone && <Icon name="check_circle" size={16} color="#1E8378" />}
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".03em", marginTop: 2, maxWidth: 100 }}>{pick(phase, lang)}</div>
              </div>
              {/* course boxes */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1, alignItems: "stretch" }}>
                {stage.courses.map((c, i) => {
                  const d = deptOf(c.code, lang);
                  const done = c.state === "done", avail = c.state === "available", locked = c.state === "locked";
                  return (
                    <div key={c.code} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div
                        className={avail ? "journey-ready" : undefined}
                        title={locked && c.needs ? `${ar ? "أكمل" : "Finish"} ${c.needs} ${ar ? "أولاً" : "first"}` : c.title}
                        style={{
                          width: isMobile ? 124 : 132, minHeight: 70, borderRadius: 13, padding: "9px 10px",
                          background: done ? d.color + "1f" : locked ? "var(--surface-2)" : "var(--surface)",
                          border: `${avail ? 2 : 1.5}px ${locked ? "dashed" : "solid"} ${locked ? "var(--border)" : d.color}`,
                          display: "flex", flexDirection: "column", justifyContent: "space-between", opacity: locked ? 0.9 : 1,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 12.5, color: locked ? "var(--faint)" : d.color }}>{c.code}</span>
                          <Icon name={STATE_ICON[c.state]} size={15} color={locked ? "var(--faint)" : d.color} />
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--muted)", lineHeight: 1.25, marginTop: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.title}</div>
                        {locked && c.needs ? (
                          <div style={{ fontSize: 9.5, color: "#B5762E", marginTop: 4, display: "flex", alignItems: "center", gap: 2 }}><Icon name="lock" size={11} />{ar ? `يتطلب ${c.needs}` : `Needs ${c.needs}`}</div>
                        ) : (
                          <div style={{ fontSize: 9.5, color: done ? "#156B61" : d.color, fontWeight: 600, marginTop: 4 }}>{done ? (ar ? "✓ مكتملة" : "✓ Done") : (ar ? "ابدأ الآن ✦" : "Ready ✦")} · {c.credits} {ar ? "س" : "cr"}</div>
                        )}
                      </div>
                      {i < stage.courses.length - 1 && !isMobile && <Icon name={ar ? "chevron_left" : "chevron_right"} size={16} color="var(--faint)" />}
                    </div>
                  );
                })}
              </div>
              {si < stages.length - 1 && false}
            </div>
          );
        })}

        {/* treasure */}
        <div style={{ display: "flex", alignItems: "center", gap: 13, background: "linear-gradient(135deg,#102A40,#1E5e57)", borderRadius: 14, padding: "16px 18px", color: "#fff", marginTop: 4 }}>
          <span style={{ fontSize: 30, lineHeight: 1 }}>🏆</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{ar ? "التخرّج — الكنز!" : "Graduation — the treasure!"}</div>
            <div style={{ fontSize: 12.5, color: "#9fb3c2", marginTop: 2 }}>{ar ? `وجهتك: ${gradTerm}` : `Your destination: ${gradTerm}`}</div>
          </div>
        </div>

        {/* legend */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--border)" }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--faint)" }}>{ar ? "المفتاح:" : "LEGEND:"}</span>
          {depts.map((d) => (
            <span key={d.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--muted)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />{d.label}
            </span>
          ))}
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--muted)" }}><Icon name="play_circle" size={14} color="#1E8378" />{ar ? "جاهزة" : "Ready"}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--muted)" }}><Icon name="lock" size={13} color="var(--faint)" />{ar ? "مقفلة" : "Locked"}</span>
        </div>
      </div>

      {/* ===== skills / careers / tools ===== */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <Section title={ar ? "مهارات سأكتسبها" : "Skills I'll gain"} accent="#7A5AA8">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {profile.skills.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text)" }}>
                <Icon name={s.icon} size={18} color="#7A5AA8" />{pick(s, lang)}
              </div>
            ))}
          </div>
        </Section>
        <Section title={ar ? "وظائف محتملة" : "Career spotlight"} accent="#2C6E91">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {profile.careers.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--text)" }}>
                <Icon name="work" size={15} color="#2C6E91" />{pick(c, lang)}
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title={ar ? "أدوات سأستخدمها" : "Tools I'll use"} accent="#1E8378">
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          {profile.tools.map((t, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 20, padding: "7px 13px", fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>
              <Icon name={t.icon} size={16} color="#1E8378" />{t.name}
            </span>
          ))}
        </div>
      </Section>

      {/* ===== fun fact + remember ===== */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, background: "#FDF6E3", border: "1px solid #EFE3C0", borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13, color: "#9A7B2E", marginBottom: 6 }}><Icon name="auto_awesome" size={17} color="#C9A227" />{ar ? "معلومة ممتعة" : "Fun fact"}</div>
          <div style={{ fontSize: 13, color: "#7a6a3e", lineHeight: 1.5 }}>{pick(profile.funFact, lang)}</div>
        </div>
        <div style={{ flex: 1, minWidth: 220, background: "#EEE7F4", border: "1px solid #ddd0e8", borderRadius: 16, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13, color: "#6B4FA0", marginBottom: 6 }}><Icon name="favorite" size={16} color="#7A5AA8" />{ar ? "تذكّر" : "Remember"}</div>
          <div style={{ fontSize: 13, color: "#5a4d6e", lineHeight: 1.5 }}>
            {ar ? "لا بأس أن تسير بوتيرتك. كل خطوة تقرّبك من هدفك 💜" : "It's okay to go at your own pace. Every step brings you closer to your goal. 💜"}
          </div>
        </div>
      </div>
    </div>
  );
}
