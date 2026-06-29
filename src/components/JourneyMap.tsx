"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { Icon } from "@/components/ui";
import { buildJourney, type CourseTuple, type JourneyState } from "@/lib/catalog";

const STAGE_META: Record<number, { en: string; ar: string; icon: string }> = {
  1: { en: "Foundations", ar: "الأساسيات", icon: "foundation" },
  2: { en: "Core", ar: "الجوهر", icon: "layers" },
  3: { en: "Advanced", ar: "المتقدّم", icon: "rocket_launch" },
  4: { en: "Capstone", ar: "التتويج", icon: "workspace_premium" },
};

const STATE_STYLE: Record<JourneyState, { bg: string; border: string; color: string; icon: string }> = {
  done: { bg: "#E6F2EF", border: "#CDE6E0", color: "#156B61", icon: "check_circle" },
  available: { bg: "var(--surface)", border: "#1E8378", color: "#1E8378", icon: "play_circle" },
  locked: { bg: "var(--surface-2)", border: "var(--border)", color: "var(--faint)", icon: "lock" },
};

export function JourneyMap({
  planCourses,
  completed,
  gradTerm,
}: {
  planCourses: CourseTuple[];
  completed: Set<string>;
  gradTerm: string;
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const stages = useMemo(() => buildJourney(planCourses, completed), [planCourses, completed]);

  const all = stages.flatMap((s) => s.courses);
  const doneCount = all.filter((n) => n.state === "done").length;
  const readyCount = all.filter((n) => n.state === "available").length;

  return (
    <div>
      {/* header + progress */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
        <Icon name="map" size={22} color="#1E8378" />
        <div className="serif" style={{ fontSize: 21, fontWeight: 600, color: "var(--ink-strong)" }}>
          {ar ? "رحلتك نحو التخرّج" : "Your journey to graduation"}
        </div>
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
        {ar
          ? `${doneCount} مكتملة · ${readyCount} جاهزة الآن · أكمليها لتفتحي ما بعدها وتصلي للكنز 🏆`
          : `${doneCount} done · ${readyCount} ready now · clear them to unlock what's next and reach the treasure 🏆`}
      </div>

      {/* legend */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18, fontSize: 12, color: "var(--muted)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="check_circle" size={15} color="#1E8378" />{ar ? "مكتملة" : "Done"}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="play_circle" size={15} color="#1E8378" />{ar ? "جاهزة الآن" : "Ready now"}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="lock" size={15} color="var(--faint)" />{ar ? "مقفلة" : "Locked"}</span>
      </div>

      {/* the winding path of stages */}
      <div style={{ position: "relative", paddingInlineStart: 30 }}>
        {/* vertical path line */}
        <div style={{ position: "absolute", insetInlineStart: 13, top: 6, bottom: 6, width: 3, background: "repeating-linear-gradient(var(--border) 0 8px, transparent 8px 14px)" }} />

        {stages.map((stage) => {
          const meta = STAGE_META[stage.level];
          const stageDone = stage.courses.every((c) => c.state === "done");
          return (
            <div key={stage.level} style={{ position: "relative", marginBottom: 22 }}>
              {/* stage dot on the path */}
              <div style={{ position: "absolute", insetInlineStart: -30, top: 0, width: 28, height: 28, borderRadius: "50%", background: stageDone ? "#1E8378" : "var(--surface)", border: `3px solid ${stageDone ? "#1E8378" : "#6BA6CF"}`, display: "flex", alignItems: "center", justifyContent: "center", color: stageDone ? "#fff" : "#6BA6CF", fontWeight: 700, fontSize: 13 }}>
                {stageDone ? <Icon name="check" size={15} /> : stage.level}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, marginInlineStart: 4 }}>
                <Icon name={meta.icon} size={18} color="#102A40" />
                <span style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink-strong)" }}>{ar ? meta.ar : meta.en}</span>
                <span style={{ fontSize: 11.5, color: "var(--faint)" }}>· {ar ? `${stage.level}٠٠` : `${stage.level}00`} {ar ? "مستوى" : "level"}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 9 }}>
                {stage.courses.map((c) => {
                  const st = STATE_STYLE[c.state];
                  const isAvail = c.state === "available";
                  return (
                    <div
                      key={c.code}
                      className={isAvail ? "journey-ready" : undefined}
                      title={c.state === "locked" && c.needs ? `${ar ? "أكملي" : "Finish"} ${c.needs} ${ar ? "أولاً" : "first"}` : c.title}
                      style={{
                        borderRadius: 12,
                        padding: "10px 11px",
                        background: st.bg,
                        border: `${isAvail ? 2 : 1}px ${c.state === "locked" ? "dashed" : "solid"} ${st.border}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        opacity: c.state === "locked" ? 0.85 : 1,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: c.state === "locked" ? "var(--faint)" : "var(--ink-strong)" }}>{c.code}</span>
                        <Icon name={st.icon} size={17} color={st.color} />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                      {c.state === "locked" && c.needs ? (
                        <div style={{ fontSize: 10.5, color: "#B5762E", display: "flex", alignItems: "center", gap: 3 }}>
                          <Icon name="lock" size={12} />{ar ? `يتطلب ${c.needs}` : `Needs ${c.needs}`}
                        </div>
                      ) : (
                        <div style={{ fontSize: 10.5, color: st.color, fontWeight: 600 }}>
                          {c.state === "done" ? (ar ? "مكتملة" : "Done") : ar ? "ابدئي الآن ✦" : "Ready now ✦"} · {c.credits} {ar ? "س" : "cr"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* the treasure */}
        <div style={{ position: "relative", marginTop: 4 }}>
          <div style={{ position: "absolute", insetInlineStart: -32, top: 2, width: 32, height: 32, borderRadius: "50%", background: "#102A40", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="flag" size={16} color="#6BA6CF" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 13, background: "linear-gradient(135deg,#102A40,#1E5e57)", borderRadius: 14, padding: "16px 18px", color: "#fff" }}>
            <span style={{ fontSize: 30, lineHeight: 1 }}>🏆</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{ar ? "التخرّج — الكنز!" : "Graduation — the treasure!"}</div>
              <div style={{ fontSize: 12.5, color: "#9fb3c2", marginTop: 2 }}>{ar ? `وجهتك: ${gradTerm}` : `Your destination: ${gradTerm}`}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
