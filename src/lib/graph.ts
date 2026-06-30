// Course graph derived from the student's actual plan + completed set.
// Prerequisites are inferred (works for any uploaded sheet): within a
// department, a course is "unlocked" once all lower-numbered courses are
// done; its nearest lower-numbered sibling is treated as its direct prereq.

import type { CourseTuple } from "./catalog";
import type { Lang } from "./i18n";

export type NodeState = "done" | "available" | "locked";

export type CourseNode = {
  code: string;
  title: string;
  credits: number;
  dept: string;
  num: number;
  level: number; // 1..4
  state: NodeState;
  prereq: string | null; // nearest lower-numbered same-dept course (display)
  unlocks: string[]; // courses this one directly unlocks
  blockedBy: string | null; // nearest incomplete prereq (why locked)
};

const numOf = (code: string) => {
  const m = code.match(/(\d{3})/);
  return m ? parseInt(m[1], 10) : 100;
};
const deptKey = (code: string) => code.split(" ")[0];
export const levelOf = (code: string) => Math.min(4, Math.max(1, Math.floor(numOf(code) / 100)));

export type LevelMeta = { level: number; en: string; ar: string; sub_en: string; sub_ar: string; color: string; icon: string };
export const LEVELS: LevelMeta[] = [
  { level: 1, en: "Foundations", ar: "الأساسيات", sub_en: "Where it all starts", sub_ar: "حيث تبدأ الرحلة", color: "#1E8378", icon: "foundation" },
  { level: 2, en: "Building Blocks", ar: "اللبنات", sub_en: "Core skills take shape", sub_ar: "تتشكّل المهارات الأساسية", color: "#2C6E91", icon: "layers" },
  { level: 3, en: "Advanced", ar: "المواد المتقدّمة", sub_en: "Specialize & go deep", sub_ar: "التخصّص والتعمّق", color: "#B5762E", icon: "rocket_launch" },
  { level: 4, en: "Capstone", ar: "التخرّج", sub_en: "The finish line", sub_ar: "خط النهاية", color: "#C2566A", icon: "workspace_premium" },
];
export const levelMeta = (level: number) => LEVELS.find((l) => l.level === level) ?? LEVELS[0];

export function buildGraph(planCourses: CourseTuple[], completed: Set<string>): CourseNode[] {
  const base = planCourses.map((c) => ({
    code: c[0],
    title: c[1],
    credits: c[3],
    dept: deptKey(c[0]),
    num: numOf(c[0]),
    level: levelOf(c[0]),
  }));

  // group by department, ascending by number
  const byDept: Record<string, typeof base> = {};
  base.forEach((n) => {
    (byDept[n.dept] ||= []).push(n);
  });
  Object.values(byDept).forEach((list) => list.sort((a, b) => a.num - b.num || a.code.localeCompare(b.code)));

  // nearest lower-numbered sibling = direct prereq
  const directPrereq = (n: { dept: string; num: number; code: string }) => {
    const list = byDept[n.dept];
    let prev: string | null = null;
    for (const m of list) {
      if (m.code === n.code) break;
      if (m.num < n.num) prev = m.code;
    }
    return prev;
  };
  // nearest INCOMPLETE lower-numbered sibling = active blocker
  const nearestBlocker = (n: { dept: string; num: number; code: string }) => {
    const list = byDept[n.dept];
    let blk: string | null = null;
    for (const m of list) {
      if (m.num < n.num && !completed.has(m.code)) blk = m.code;
    }
    return blk;
  };
  // available only when EVERY lower-numbered sibling is complete (matches journey semantics)
  const allLowerDone = (n: { dept: string; num: number }) =>
    byDept[n.dept].every((m) => !(m.num < n.num && !completed.has(m.code)));

  const prereqMap = new Map<string, string | null>();
  base.forEach((n) => prereqMap.set(n.code, directPrereq(n)));

  // unlocks = reverse of direct prereq
  const unlocksMap: Record<string, string[]> = {};
  base.forEach((n) => {
    const p = prereqMap.get(n.code);
    if (p) (unlocksMap[p] ||= []).push(n.code);
  });

  return base.map((n) => {
    const blockedBy = nearestBlocker(n);
    const state: NodeState = completed.has(n.code) ? "done" : allLowerDone(n) ? "available" : "locked";
    return {
      code: n.code,
      title: n.title,
      credits: n.credits,
      dept: n.dept,
      num: n.num,
      level: n.level,
      state,
      prereq: prereqMap.get(n.code) ?? null,
      unlocks: unlocksMap[n.code] ?? [],
      blockedBy,
    };
  });
}

export type GraphStage = { level: number; meta: LevelMeta; nodes: CourseNode[]; done: number; total: number };

export function stagesOf(nodes: CourseNode[]): GraphStage[] {
  const out: GraphStage[] = [];
  for (const meta of LEVELS) {
    const ns = nodes
      .filter((n) => n.level === meta.level)
      .sort((a, b) => a.num - b.num || a.code.localeCompare(b.code));
    if (!ns.length) continue;
    out.push({
      level: meta.level,
      meta,
      nodes: ns,
      done: ns.filter((n) => n.state === "done").length,
      total: ns.length,
    });
  }
  return out;
}

// Courses the student can take right now, prioritized: lower level first, then
// the ones that unlock the most downstream courses (highest leverage).
export function suggestedNext(nodes: CourseNode[], limit = 4): CourseNode[] {
  return nodes
    .filter((n) => n.state === "available")
    .sort((a, b) => a.level - b.level || b.unlocks.length - a.unlocks.length || a.num - b.num)
    .slice(0, limit);
}

export function nodeByCode(nodes: CourseNode[], code: string): CourseNode | undefined {
  return nodes.find((n) => n.code === code);
}

export function stateLabel(state: NodeState, lang: Lang): string {
  const ar = lang === "ar";
  if (state === "done") return ar ? "مكتملة" : "Completed";
  if (state === "available") return ar ? "متاحة الآن" : "Available now";
  return ar ? "مقفلة" : "Locked";
}

export const STATE_STYLE: Record<NodeState, { bg: string; fg: string; border: string; icon: string }> = {
  done: { bg: "#1E8378", fg: "#ffffff", border: "#1E8378", icon: "check_circle" },
  available: { bg: "#EAF1F7", fg: "#1E5E78", border: "#1E8378", icon: "bolt" },
  locked: { bg: "var(--surface-2)", fg: "#9aa6ad", border: "var(--border)", icon: "lock" },
};
