"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { Icon } from "@/components/ui";
import { resolvePlanCourses, programTotalCredits } from "@/lib/catalog";
import { CourseGarden } from "@/components/CourseGarden";
import { GARDEN_COURSES, GARDEN_EDGES, coursesToGarden } from "@/lib/garden/data";
import { ScenarioPlanner } from "@/components/ScenarioPlanner";

export default function CoursesPage() {
  const { lang } = useI18n();
  const { profile } = useAuth();
  const { programCourses } = useData();
  const router = useRouter();
  const ar = lang === "ar";
  const [tab, setTab] = useState<"map" | "scenarios">("map");

  const major = profile?.major || "Computer Science";
  const planCourses = useMemo(() => resolvePlanCourses(programCourses, major), [programCourses, major]);
  const total = useMemo(() => programTotalCredits(major, programCourses), [major, programCourses]);

  // Build the garden from the student's OWN uploaded sheet (program_courses) when
  // available; otherwise show the built-in sample so the page is never empty.
  const garden = useMemo(
    () => (programCourses.length ? coursesToGarden(programCourses) : { courses: GARDEN_COURSES, edges: GARDEN_EDGES }),
    [programCourses],
  );
  const usingOwnSheet = programCourses.length > 0;

  const tabs: { key: "map" | "scenarios"; label: string; icon: string }[] = [
    { key: "map", label: ar ? "حديقتي" : "My Garden", icon: "account_tree" },
    { key: "scenarios", label: ar ? "خطط الفصول" : "Plan semesters", icon: "calendar_view_month" },
  ];

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }} className="fade-up">
      {/* tab switch + upload */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, background: "var(--surface-2)", padding: 5, borderRadius: 13 }}>
          {tabs.map((tb) => {
            const active = tab === tb.key;
            return (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, background: active ? "var(--surface)" : "transparent", color: active ? "var(--ink-strong)" : "var(--muted)", boxShadow: active ? "0 1px 4px rgba(16,42,64,.1)" : "none" }}
              >
                <Icon name={tb.icon} size={18} color={active ? "#1E8378" : "var(--faint)"} />{tb.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => router.push("/onboarding?setup=1")}
          style={{ display: "flex", alignItems: "center", gap: 7, background: usingOwnSheet ? "var(--surface)" : "#1E8378", color: usingOwnSheet ? "var(--text)" : "#fff", border: usingOwnSheet ? "1px solid var(--border)" : "none", borderRadius: 11, padding: "9px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
        >
          <Icon name="upload_file" size={17} color={usingOwnSheet ? "#1E8378" : "#fff"} />
          {usingOwnSheet ? (ar ? "تحديث كشفي" : "Update my sheet") : (ar ? "ارفع كشفك" : "Upload your major sheet")}
        </button>
      </div>

      {tab === "map" ? (
        <CourseGarden courses={garden.courses} edges={garden.edges} />
      ) : (
        <ScenarioPlanner planCourses={planCourses} total={total} />
      )}
    </div>
  );
}
