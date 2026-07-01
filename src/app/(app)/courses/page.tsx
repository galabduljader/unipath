"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { useIsMobile } from "@/components/ui";
import { computePlan, resolvePlanCourses, programTotalCredits } from "@/lib/catalog";
import { MajorOrgChart } from "@/components/MajorOrgChart";
import { ScenarioPlanner } from "@/components/ScenarioPlanner";

export default function CoursesPage() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const { completed, programCourses } = useData();
  useIsMobile();
  const ar = lang === "ar";
  const [tab, setTab] = useState<"map" | "scenarios">("map");

  const major = profile?.major || "Computer Science";
  const planCourses = useMemo(() => resolvePlanCourses(programCourses, major), [programCourses, major]);
  const total = useMemo(() => programTotalCredits(major, programCourses), [major, programCourses]);
  const plan = useMemo(() => computePlan(planCourses, completed, lang, t, total), [planCourses, completed, lang, t, total]);

  const tabs: { key: "map" | "scenarios"; label: string; icon: string }[] = [
    { key: "map", label: ar ? "الخريطة" : "Map", icon: "account_tree" },
    { key: "scenarios", label: ar ? "خطط الفصول" : "Plan semesters", icon: "calendar_view_month" },
  ];

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }} className="fade-up">
      {/* tab switch */}
      <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", padding: 5, borderRadius: 13, alignSelf: "flex-start" }}>
        {tabs.map((tb) => {
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, background: active ? "var(--surface)" : "transparent", color: active ? "var(--ink-strong)" : "var(--muted)", boxShadow: active ? "0 1px 4px rgba(16,42,64,.1)" : "none" }}
            >
              <Tabicon name={tb.icon} active={active} />{tb.label}
            </button>
          );
        })}
      </div>

      {tab === "map" ? (
        <MajorOrgChart planCourses={planCourses} total={total} gradTerm={plan.gradTerm} major={major} />
      ) : (
        <ScenarioPlanner planCourses={planCourses} total={total} />
      )}
    </div>
  );
}

import { Icon } from "@/components/ui";
function Tabicon({ name, active }: { name: string; active: boolean }) {
  return <Icon name={name} size={18} color={active ? "#1E8378" : "var(--faint)"} />;
}
