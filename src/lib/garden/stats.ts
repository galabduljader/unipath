// Reusable garden logic: turn courses + edges + the student's completed set into
// everything the UI needs — per-course status, the growth "stage" of each plant,
// progress totals, the best next course to take, and an estimated graduation term.
// Pure functions; no React, no styling.

import type { Course } from "@/lib/schema/majorSheet";
import { toCourseKey } from "@/lib/schema/majorSheet";
import { computeStatuses, type CourseEdge, type CourseStatus } from "@/lib/majorSheet/graph";

// Plant growth stage per status — the heart of the garden metaphor.
export type Stage = "seed" | "sprout" | "bud" | "flower";
export const STAGE_OF: Record<CourseStatus, Stage> = {
  locked: "seed",
  available: "sprout",
  in_progress: "bud",
  completed: "flower",
};

export type GardenStats = {
  statuses: Map<string, CourseStatus>;
  unlocksCount: Map<string, number>; // direct dependents per course
  completedCount: number;
  totalCount: number;
  earnedCredits: number;
  totalCredits: number;
  progressPct: number;
  nextCourse: Course | null; // highest-leverage available course
  semestersLeft: number;
  gradTerm: string;
};

// Direct dependents (reverse of prerequisite edges): what each course unlocks.
export function unlocksMap(edges: CourseEdge[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const e of edges) {
    if (e.kind !== "prerequisite") continue;
    if (!m.has(e.sourceKey)) m.set(e.sourceKey, []);
    if (!m.get(e.sourceKey)!.includes(e.targetKey)) m.get(e.sourceKey)!.push(e.targetKey);
  }
  return m;
}

// The upcoming term is Fall 2026 (today is mid-2026). Step Fall → Spring from there.
function termLabel(semestersFromNow: number): string {
  if (semestersFromNow <= 0) return "Ready to graduate 🎉";
  const idx = semestersFromNow - 1; // the term you finish in
  const isFall = idx % 2 === 0;
  const year = 2026 + Math.floor(idx / 2) + (isFall ? 0 : 1);
  return `${isFall ? "Fall" : "Spring"} ${year}`;
}

export function computeGardenStats(
  courses: Course[],
  edges: CourseEdge[],
  completed: Set<string>,
  opts?: { creditsPerSemester?: number },
): GardenStats {
  const completedKeys = new Set([...completed].map(toCourseKey));
  const statuses = computeStatuses(courses, { completed: completedKeys });

  const unlocks = unlocksMap(edges);
  const unlocksCount = new Map<string, number>();
  for (const c of courses) unlocksCount.set(c.id, (unlocks.get(c.id) ?? []).length);

  const real = courses.filter((c) => !c.external);
  const totalCount = real.length;
  const totalCredits = real.reduce((a, c) => a + c.credits, 0);
  const completedCourses = real.filter((c) => statuses.get(c.id) === "completed");
  const completedCount = completedCourses.length;
  const earnedCredits = completedCourses.reduce((a, c) => a + c.credits, 0);
  const progressPct = totalCredits ? Math.round((earnedCredits / totalCredits) * 100) : 0;

  // Next course: an available course that unlocks the most (highest leverage),
  // tie-broken by fewest credits then code — a gentle, non-overwhelming nudge.
  const available = real.filter((c) => statuses.get(c.id) === "available");
  const nextCourse =
    available.slice().sort((a, b) => (unlocksCount.get(b.id)! - unlocksCount.get(a.id)!) || a.credits - b.credits || a.code.localeCompare(b.code))[0] ?? null;

  const perSem = opts?.creditsPerSemester ?? 15;
  const remainingCredits = Math.max(0, totalCredits - earnedCredits);
  const semestersLeft = Math.ceil(remainingCredits / perSem);
  const gradTerm = termLabel(semestersLeft);

  return {
    statuses,
    unlocksCount,
    completedCount,
    totalCount,
    earnedCredits,
    totalCredits,
    progressPct,
    nextCourse,
    semestersLeft,
    gradTerm,
  };
}
