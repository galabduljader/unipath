// Mock degree plan for the Garden experience — a small, clean 15-course set so the
// plant never gets overwhelming. Built on the SAME shared Course/edge contract and
// graph utilities as the real major-sheet pipeline, so the prerequisite/status logic
// is fully reusable: swap this for a parsed sheet and everything still works.

import type { Course } from "@/lib/schema/majorSheet";
import { deriveEdges, type CourseEdge } from "@/lib/majorSheet/graph";
import { toCourseKey, type RequirementGroup } from "@/lib/schema/majorSheet";

type Seed = {
  id: string;
  code: string;
  name: string;
  credits?: number;
  group: RequirementGroup;
  prereqs?: string[][];
  senior?: boolean;
};

// prereqs use the AND/OR group model: [[a, b], [c]] = (a OR b) AND (c).
const SEEDS: Seed[] = [
  { id: "ENGL110", code: "ENGL 110", name: "English Composition I", group: "gen_ed" },
  { id: "ENGL120", code: "ENGL 120", name: "English Composition II", group: "gen_ed", prereqs: [["ENGL110"]] },
  { id: "MATH110", code: "MATH 110", name: "College Algebra", group: "gen_ed" },
  { id: "POLS120", code: "POLS 120", name: "Government & Society", group: "gen_ed" },
  { id: "COMM202", code: "COMM 202", name: "Business Communication", group: "gen_ed", prereqs: [["ENGL110"]] },

  { id: "BUSG101", code: "BUSG 101", name: "Introduction to Business", group: "college_basic" },
  { id: "INFS120", code: "INFS 120", name: "Introduction to Information Systems", group: "college_basic" },
  { id: "ACCT130", code: "ACCT 130", name: "Financial Accounting I", group: "college_basic", prereqs: [["BUSG101"], ["MATH110"]] },
  { id: "MARK201", code: "MARK 201", name: "Principles of Marketing", group: "college_basic", prereqs: [["BUSG101"]] },

  { id: "BUSG230", code: "BUSG 230", name: "Entrepreneurship", group: "major_required", prereqs: [["BUSG101"]] },
  { id: "INFS221", code: "INFS 221", name: "Business Programming I", group: "major_required", prereqs: [["INFS120"]] },
  { id: "INFS321", code: "INFS 321", name: "Business Programming II", group: "major_required", prereqs: [["INFS221"]] },
  { id: "ACCT290", code: "ACCT 290", name: "Managerial Accounting", group: "major_required", prereqs: [["ACCT130"]] },
  { id: "INFS401", code: "INFS 401", name: "Information Security", group: "major_required", prereqs: [["INFS321"]] },

  { id: "CAPS400", code: "CAPS 400", name: "Capstone Project", group: "practical", prereqs: [["INFS401"], ["ACCT290"], ["MARK201"]], senior: true },
];

function toCourse(s: Seed): Course {
  return {
    id: s.id,
    code: s.code,
    name: s.name,
    nameAr: null,
    credits: s.credits ?? 3,
    requirementGroup: s.group,
    prerequisites: s.prereqs ?? [],
    corequisites: [],
    standing: s.senior ? "senior" : null,
    external: false,
    alsoIn: [],
    needsReview: false,
    note: null,
  };
}

export const GARDEN_COURSES: Course[] = SEEDS.map(toCourse);
export const GARDEN_EDGES: CourseEdge[] = deriveEdges(GARDEN_COURSES);

// Friendly category labels for the Seed Bank view.
export const GROUP_LABELS: Record<RequirementGroup, { en: string; ar: string }> = {
  gen_ed: { en: "General Education", ar: "متطلبات عامة" },
  college_basic: { en: "Business Core", ar: "أساسيات الأعمال" },
  college_advanced: { en: "Advanced Business", ar: "أعمال متقدّمة" },
  major_required: { en: "Information Systems Major", ar: "تخصّص نظم المعلومات" },
  major_elective: { en: "Major Electives", ar: "اختيارية التخصّص" },
  practical: { en: "Capstone", ar: "مشروع التخرّج" },
  external: { en: "Preparatory", ar: "تحضيري" },
};

// Build a garden from the student's OWN course list (from their uploaded major
// sheet, stored as program_courses). We only have code/title/credits, so group and
// prerequisites are inferred: requirement group by course-number band, and each
// course's prerequisite is its nearest lower-numbered same-department course.
const numOf = (code: string) => { const m = code.match(/(\d{3})/); return m ? parseInt(m[1], 10) : 100; };
const deptOf = (code: string) => code.split(/\s+/)[0].toUpperCase();

function groupOf(num: number): RequirementGroup {
  if (num < 200) return "gen_ed";
  if (num < 300) return "college_basic";
  if (num < 400) return "major_required";
  return "practical";
}

export function coursesToGarden(list: { code: string; title: string; credits: number }[]): { courses: Course[]; edges: CourseEdge[] } {
  const clean = list.filter((c) => c.code && c.code.trim().length >= 2);
  const byDept = new Map<string, typeof clean>();
  for (const c of clean) {
    const d = deptOf(c.code);
    if (!byDept.has(d)) byDept.set(d, []);
    byDept.get(d)!.push(c);
  }
  for (const arr of byDept.values()) arr.sort((a, b) => numOf(a.code) - numOf(b.code) || a.code.localeCompare(b.code));

  const prereqOf = (code: string): string[][] => {
    const list = byDept.get(deptOf(code)) ?? [];
    const n = numOf(code);
    let prev: string | null = null;
    for (const m of list) {
      if (m.code === code) break;
      if (numOf(m.code) < n) prev = m.code;
    }
    return prev ? [[toCourseKey(prev)]] : [];
  };

  const courses: Course[] = clean.map((c) => ({
    id: toCourseKey(c.code),
    code: c.code.trim(),
    name: c.title?.trim() || c.code.trim(),
    nameAr: null,
    credits: Math.max(0, Math.round(Number(c.credits) || 3)),
    requirementGroup: groupOf(numOf(c.code)),
    prerequisites: prereqOf(c.code),
    corequisites: [],
    standing: null,
    external: false,
    alsoIn: [],
    needsReview: false,
    note: null,
  }));

  return { courses, edges: deriveEdges(courses) };
}
