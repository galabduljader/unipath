// Graph building + validation for a parsed major sheet.
//
// The parsed `courses` carry the AND/OR prerequisite/corequisite GROUPS (the source
// of truth). From those we DERIVE a flat edge list (`course_edges`) for fast graph
// queries, layout ranking, and client-side highlight traversal. This module is pure
// (no I/O, no React) so it runs identically in the browser, in a Node/Next context,
// and — mirrored — inside the extraction Edge Function.

import type { Course, MajorSheet, ReqGroups } from "@/lib/schema/majorSheet";
import { toCourseKey } from "@/lib/schema/majorSheet";

export type EdgeKind = "prerequisite" | "corequisite";

export type CourseEdge = {
  sourceKey: string; // the prerequisite/corequisite course
  targetKey: string; // the course that depends on it
  kind: EdgeKind;
  isAlternative: boolean; // true when it came from a multi-option OR group
};

export type CourseStatus = "completed" | "in_progress" | "available" | "locked";

// ---------------------------------------------------------------------------
// Edge derivation
// ---------------------------------------------------------------------------

function edgesFromGroups(targetKey: string, groups: ReqGroups, kind: EdgeKind): CourseEdge[] {
  const out: CourseEdge[] = [];
  for (const group of groups) {
    const isAlternative = group.length > 1; // OR group with >1 option
    for (const rawSource of group) {
      const sourceKey = toCourseKey(rawSource);
      if (!sourceKey || sourceKey === targetKey) continue; // drop self-loops
      out.push({ sourceKey, targetKey, kind, isAlternative });
    }
  }
  return out;
}

// Flatten every course's prerequisite/corequisite groups into edges, de-duplicated.
export function deriveEdges(courses: Course[]): CourseEdge[] {
  const seen = new Set<string>();
  const out: CourseEdge[] = [];
  for (const c of courses) {
    const all = [
      ...edgesFromGroups(c.id, c.prerequisites, "prerequisite"),
      ...edgesFromGroups(c.id, c.corequisites, "corequisite"),
    ];
    for (const e of all) {
      const k = `${e.kind}:${e.sourceKey}->${e.targetKey}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(e);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Validation (run after Zod, before writing to DB)
// ---------------------------------------------------------------------------

export type ValidationResult = {
  courses: Course[]; // deduped, with synthesized external nodes appended
  edges: CourseEdge[]; // derived from the (post-dedup) courses
  warnings: string[];
};

// Codes that clearly look remedial/placement rather than degree courses. Used to
// decide whether an unresolved reference becomes an external node or just a warning.
const REMEDIAL_RE = /\b0\d{2}[A-Z]?$/; // e.g. ENGL095, MATH099

function looksRemedial(key: string): boolean {
  return REMEDIAL_RE.test(key);
}

function spacedCode(key: string): string {
  // "INFS221" -> "INFS 221" for a friendlier display fallback
  const m = key.match(/^([A-Z]+)\s*(\d.*)$/);
  return m ? `${m[1]} ${m[2]}` : key;
}

// Deduplicate course keys (merging alsoIn), synthesize external nodes for
// unresolved references (or warn), and detect cycles. Never silently drops data.
export function validateSheet(sheet: MajorSheet): ValidationResult {
  const warnings = [...sheet.warnings];

  // 1) Deduplicate by course_key, merging alsoIn + preferring the richer row.
  const byKey = new Map<string, Course>();
  for (const c of sheet.courses) {
    const existing = byKey.get(c.id);
    if (!existing) {
      byKey.set(c.id, { ...c, alsoIn: [...new Set(c.alsoIn)] });
      continue;
    }
    warnings.push(`Duplicate course ${c.code} (${c.id}) merged.`);
    byKey.set(c.id, {
      ...existing,
      // keep the first non-empty name/credits; union alsoIn + the dup's code
      name: existing.name || c.name,
      nameAr: existing.nameAr ?? c.nameAr,
      credits: existing.credits || c.credits,
      prerequisites: existing.prerequisites.length ? existing.prerequisites : c.prerequisites,
      corequisites: existing.corequisites.length ? existing.corequisites : c.corequisites,
      alsoIn: [...new Set([...existing.alsoIn, ...c.alsoIn, c.code])].filter((s) => s !== existing.code),
      needsReview: existing.needsReview || c.needsReview,
    });
  }

  // 2) Resolve dangling references. Every key appearing in a group must resolve to
  //    a node — synthesize an external node when it looks remedial, else warn.
  const referenced = new Set<string>();
  for (const c of byKey.values()) {
    for (const groups of [c.prerequisites, c.corequisites]) {
      for (const group of groups) for (const raw of group) referenced.add(toCourseKey(raw));
    }
  }
  for (const key of referenced) {
    if (!key || byKey.has(key)) continue;
    if (looksRemedial(key)) {
      byKey.set(key, {
        id: key,
        code: spacedCode(key),
        name: spacedCode(key),
        nameAr: null,
        credits: 0,
        requirementGroup: "external",
        prerequisites: [],
        corequisites: [],
        standing: null,
        external: true,
        alsoIn: [],
        needsReview: false,
        note: "Referenced as a prerequisite but not listed on the sheet (assumed remedial/placement).",
      });
    } else {
      warnings.push(`Prerequisite "${spacedCode(key)}" is referenced but not found among listed courses.`);
    }
  }

  const courses = [...byKey.values()];
  let edges = deriveEdges(courses);

  // 3) Cycle detection over prerequisite edges only (corequisites may be mutual).
  //    Report offending edges in warnings — never silently drop them.
  const cyclic = findCycleEdges(courses, edges.filter((e) => e.kind === "prerequisite"));
  if (cyclic.length) {
    for (const e of cyclic) {
      warnings.push(`Prerequisite cycle: ${spacedCode(e.sourceKey)} → ${spacedCode(e.targetKey)} (please verify the sheet).`);
    }
  }

  // Drop edges whose endpoints don't resolve to a node (a non-remedial dangling
  // ref already warned above) so the rendered graph stays consistent.
  const keys = new Set(courses.map((c) => c.id));
  edges = edges.filter((e) => keys.has(e.sourceKey) && keys.has(e.targetKey));

  return { courses, edges, warnings };
}

// Return the set of edges that participate in a cycle (Kahn's algorithm: whatever
// can't be topologically removed sits inside or downstream of a cycle).
function findCycleEdges(courses: Course[], prereqEdges: CourseEdge[]): CourseEdge[] {
  const keys = new Set(courses.map((c) => c.id));
  const indeg = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const k of keys) {
    indeg.set(k, 0);
    adj.set(k, []);
  }
  for (const e of prereqEdges) {
    if (!keys.has(e.sourceKey) || !keys.has(e.targetKey)) continue;
    adj.get(e.sourceKey)!.push(e.targetKey);
    indeg.set(e.targetKey, (indeg.get(e.targetKey) ?? 0) + 1);
  }
  const queue = [...keys].filter((k) => (indeg.get(k) ?? 0) === 0);
  const removed = new Set<string>();
  while (queue.length) {
    const k = queue.shift()!;
    removed.add(k);
    for (const nxt of adj.get(k) ?? []) {
      indeg.set(nxt, (indeg.get(nxt) ?? 0) - 1);
      if ((indeg.get(nxt) ?? 0) === 0) queue.push(nxt);
    }
  }
  if (removed.size === keys.size) return []; // acyclic
  // Any edge between two not-removed nodes is part of the cyclic remainder.
  return prereqEdges.filter((e) => !removed.has(e.sourceKey) && !removed.has(e.targetKey));
}

// ---------------------------------------------------------------------------
// Layout ranking: prerequisite depth (roots at top, capstones at bottom)
// ---------------------------------------------------------------------------

export function prereqDepth(courses: Course[], edges: CourseEdge[]): Map<string, number> {
  const keys = new Set(courses.map((c) => c.id));
  const parents = new Map<string, string[]>(); // targetKey -> its prerequisite sources
  for (const k of keys) parents.set(k, []);
  for (const e of edges) {
    if (e.kind !== "prerequisite") continue;
    if (keys.has(e.targetKey) && keys.has(e.sourceKey)) parents.get(e.targetKey)!.push(e.sourceKey);
  }
  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  const compute = (k: string): number => {
    if (depth.has(k)) return depth.get(k)!;
    if (visiting.has(k)) return 0; // cycle guard
    visiting.add(k);
    const ps = parents.get(k) ?? [];
    const d = ps.length ? 1 + Math.max(...ps.map(compute)) : 0;
    visiting.delete(k);
    depth.set(k, d);
    return d;
  };
  for (const k of keys) compute(k);
  return depth;
}

// ---------------------------------------------------------------------------
// Student progress status
// ---------------------------------------------------------------------------

export type StatusInput = {
  completed: Set<string>; // normalized course keys the student has finished
  inProgress?: Set<string>; // normalized keys currently being taken
};

// A course is `available` when EVERY prerequisite AND-group has at least one
// completed option (OR satisfied). Standing is treated as a badge, not a blocker.
export function computeStatuses(courses: Course[], input: StatusInput): Map<string, CourseStatus> {
  const completed = input.completed;
  const inProgress = input.inProgress ?? new Set<string>();
  const out = new Map<string, CourseStatus>();
  for (const c of courses) {
    if (completed.has(c.id)) {
      out.set(c.id, "completed");
      continue;
    }
    if (inProgress.has(c.id)) {
      out.set(c.id, "in_progress");
      continue;
    }
    const prereqsMet = c.prerequisites.every((group) => group.some((k) => completed.has(toCourseKey(k))));
    out.set(c.id, prereqsMet ? "available" : "locked");
  }
  return out;
}

// ---------------------------------------------------------------------------
// Adjacency for click-to-highlight (transitive ancestors + descendants)
// ---------------------------------------------------------------------------

export type Adjacency = {
  incoming: Map<string, Set<string>>; // key -> its direct prerequisite sources
  outgoing: Map<string, Set<string>>; // key -> courses that directly depend on it
};

export function buildAdjacency(edges: CourseEdge[]): Adjacency {
  const incoming = new Map<string, Set<string>>();
  const outgoing = new Map<string, Set<string>>();
  const add = (m: Map<string, Set<string>>, k: string, v: string) => {
    if (!m.has(k)) m.set(k, new Set());
    m.get(k)!.add(v);
  };
  for (const e of edges) {
    add(incoming, e.targetKey, e.sourceKey);
    add(outgoing, e.sourceKey, e.targetKey);
  }
  return { incoming, outgoing };
}

function traverse(start: string, adj: Map<string, Set<string>>): Set<string> {
  const seen = new Set<string>();
  const stack = [...(adj.get(start) ?? [])];
  while (stack.length) {
    const k = stack.pop()!;
    if (seen.has(k)) continue;
    seen.add(k);
    for (const n of adj.get(k) ?? []) if (!seen.has(n)) stack.push(n);
  }
  return seen;
}

// Everything `key` transitively depends on (upstream).
export function ancestorsOf(key: string, adj: Adjacency): Set<string> {
  return traverse(key, adj.incoming);
}

// Everything that transitively depends on `key` (downstream).
export function descendantsOf(key: string, adj: Adjacency): Set<string> {
  return traverse(key, adj.outgoing);
}
