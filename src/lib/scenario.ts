// Semester scenario engine: distribute remaining courses into future terms at a
// chosen credit load, respecting prerequisite order, and report graduation term
// and any prereq conflicts. Pure functions — no React, no I/O.

import { termAt } from "./catalog";
import type { CourseNode } from "./graph";

export type SemPlan = { offset: number; codes: string[] };
export type LoadPreset = 12 | 15 | 18;

const isSummer = (offset: number) => (((offset % 3) + 3) % 3) === 2;

// Greedily fill future terms up to `perTerm` credits. `remaining` must already
// be in a sensible take-order (level then number) so prereqs land first.
export function autoPlan(remaining: CourseNode[], perTerm: LoadPreset, summers: boolean): SemPlan[] {
  const sems: SemPlan[] = [];
  let o = 0;
  let i = 0;
  let guard = 0;
  while (i < remaining.length && guard++ < 200) {
    if (!summers && isSummer(o)) { o++; continue; }
    const cap = isSummer(o) ? Math.min(6, perTerm) : perTerm;
    const codes: string[] = [];
    let cr = 0;
    while (i < remaining.length && (cr === 0 || cr + remaining[i].credits <= cap)) {
      codes.push(remaining[i].code);
      cr += remaining[i].credits;
      i++;
    }
    sems.push({ offset: o, codes });
    o++;
  }
  return sems;
}

export function termName(offset: number, lang: "en" | "ar"): string {
  return termAt(offset)[lang === "ar" ? "ar" : "en"];
}

export function creditsOf(codes: string[], nodes: CourseNode[]): number {
  const by = new Map(nodes.map((n) => [n.code, n]));
  return codes.reduce((a, c) => a + (by.get(c)?.credits ?? 3), 0);
}

// A conflict = a course placed in the same or an earlier term than its prereq
// (and the prereq isn't already completed before the plan starts).
export type Conflict = { code: string; prereq: string };
export function conflictsOf(sems: SemPlan[], nodes: CourseNode[]): Conflict[] {
  const by = new Map(nodes.map((n) => [n.code, n]));
  const termOf = new Map<string, number>();
  sems.forEach((s, idx) => s.codes.forEach((c) => termOf.set(c, idx)));
  const out: Conflict[] = [];
  for (const [code, idx] of termOf) {
    const n = by.get(code);
    if (!n?.prereq) continue;
    // prereq only matters if it's part of the plan (not already done)
    if (!termOf.has(n.prereq)) continue;
    // a real ordering error = prereq scheduled in a strictly LATER term
    if (termOf.get(n.prereq)! > idx) out.push({ code, prereq: n.prereq });
  }
  return out;
}

// Move a course one term earlier (-1) or later (+1), creating a trailing term as
// needed and dropping any empties. Returns a new plan.
export function moveCourse(sems: SemPlan[], code: string, dir: -1 | 1, summers: boolean): SemPlan[] {
  const idx = sems.findIndex((s) => s.codes.includes(code));
  if (idx < 0) return sems;
  let target = idx + dir;
  if (target < 0) return sems;
  let next = sems.map((s) => ({ offset: s.offset, codes: [...s.codes] }));
  next[idx].codes = next[idx].codes.filter((c) => c !== code);
  if (target >= next.length) next.push({ offset: 0, codes: [] });
  next[target].codes.push(code);
  next = next.filter((s) => s.codes.length > 0);
  return reindex(next, summers);
}

// The ordered list of term offsets a plan occupies (fall/spring, plus summers
// only when allowed). termAt(): offset%3 → 0 Fall, 1 Spring, 2 Summer.
function termSequence(count: number, summers: boolean): number[] {
  const offs: number[] = [];
  let o = 0;
  let guard = 0;
  while (offs.length < count && guard++ < 200) {
    if (summers || !isSummer(o)) offs.push(o);
    o++;
  }
  return offs;
}

// Re-anchor offsets to a clean forward sequence from Fall 2026.
function reindex(sems: SemPlan[], summers: boolean): SemPlan[] {
  const seq = termSequence(sems.length, summers);
  return sems.map((s, i) => ({ offset: seq[i], codes: s.codes }));
}
