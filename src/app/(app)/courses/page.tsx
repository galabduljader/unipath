"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { Icon, useIsMobile } from "@/components/ui";
import { computePlan, resolvePlanCourses, programTotalCredits } from "@/lib/catalog";
import { eligibleCourses, lockedCourses } from "@/lib/content";

const card: React.CSSProperties = { background: "#fff", border: "1px solid #E7E0D3", borderRadius: 18, padding: 22 };

export default function CoursesPage() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const { completed, programCourses } = useData();
  const isMobile = useIsMobile();
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const major = profile?.major || "Computer Science";
  const planCourses = useMemo(() => resolvePlanCourses(programCourses, major), [programCourses, major]);
  const total = useMemo(() => programTotalCredits(major, programCourses), [major, programCourses]);
  const plan = useMemo(() => computePlan(planCourses, completed, lang, t, total), [planCourses, completed, lang, t, total]);
  const elig = eligibleCourses(lang);
  const locked = lockedCourses(lang);
  const grid = isMobile ? "1fr" : "repeat(auto-fill,minmax(240px,1fr))";

  const stats = [
    { value: String(elig.length), label: t.eligibleNowStat, icon: "check_circle", bg: "#E6F2EF", fg: "#1E8378" },
    { value: String(plan.remainingCredits), label: t.creditsRemainingStat, icon: "pending", bg: "#EAF1F7", fg: "#2C6E91" },
    { value: String(locked.length), label: t.lockedStat, icon: "lock", bg: "#F4EEE3", fg: "#B5762E" },
  ];

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }} className="fade-up">
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {stats.map((s, i) => (
          <div key={i} style={{ flex: 1, minWidth: 160, background: "#fff", border: "1px solid #E7E0D3", borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: s.bg, color: s.fg, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={s.icon} size={23} /></div>
            <div><div className="serif" style={{ fontSize: 26, fontWeight: 600, color: "#102A40", lineHeight: 1 }}>{s.value}</div><div style={{ fontSize: 12, color: "#6E7C86", marginTop: 2 }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* eligible */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#1E8378" }} />
          <div className="serif" style={{ fontSize: 20, fontWeight: 600, color: "#102A40", whiteSpace: "nowrap" }}>{t.eligibleNow}</div>
          <span style={{ background: "#E6F2EF", color: "#156B61", fontWeight: 700, fontSize: 12, padding: "3px 9px", borderRadius: 7 }}>{elig.length}</span>
        </div>
        <div style={{ fontSize: 13, color: "#6E7C86", marginBottom: 16 }}>{t.eligibleNowSub}</div>
        <div style={{ display: "grid", gridTemplateColumns: grid, gap: 12 }}>
          {elig.map((c) => {
            const on = !!added[c.code];
            return (
              <div key={c.code} style={{ border: "1px solid #E7E0D3", borderRadius: 13, padding: 15, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#102A40" }}>{c.code}</div>
                    <div style={{ fontSize: 13, color: "#42525C" }}>{c.title}</div>
                  </div>
                  <span style={{ background: "#F4EEE3", color: "#6E7C86", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>{c.cr} {t.cr}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#1E8378" }}><Icon name="check_circle" size={14} />{t.prereq}: {c.prereq}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#9aa6ad" }}>{c.cat}</span>
                  <button onClick={() => setAdded((p) => ({ ...p, [c.code]: !p[c.code] }))} style={{ border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, color: on ? "#156B61" : "#fff", background: on ? "#E6F2EF" : "#1E8378" }}>
                    {on && <Icon name="check" size={14} />}{on ? t.added : t.addToPlan}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* locked */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Icon name="lock" size={20} color="#9aa6ad" />
          <div className="serif" style={{ fontSize: 20, fontWeight: 600, color: "#102A40" }}>{t.locked}</div>
        </div>
        <div style={{ fontSize: 13, color: "#6E7C86", marginBottom: 16 }}>{t.lockedSub}</div>
        <div style={{ display: "grid", gridTemplateColumns: grid, gap: 12 }}>
          {locked.map((c) => (
            <div key={c.code} style={{ border: "1px dashed #D8CFBF", borderRadius: 13, padding: 15, background: "#FBF9F4", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div><div style={{ fontWeight: 700, fontSize: 14, color: "#5d6a72" }}>{c.code}</div><div style={{ fontSize: 13, color: "#7a868d" }}>{c.title}</div></div>
                <span style={{ background: "#fff", color: "#9aa6ad", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>{c.cr} {t.cr}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#C9892F" }}><Icon name="lock" size={14} />{c.reason}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
