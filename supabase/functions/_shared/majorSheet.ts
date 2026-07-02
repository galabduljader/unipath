// Deno mirror of src/lib/schema/majorSheet.ts + the pure bits of
// src/lib/majorSheet/graph.ts. The Edge Function can't import the app's `@/`
// aliases, so the data contract + validation live here too. Keep the two in sync:
// this is the SERVER-side validator of untrusted model output before any DB write.

import { z } from "npm:zod@^4.4.3";

export const REQUIREMENT_GROUPS = [
  "gen_ed",
  "college_basic",
  "college_advanced",
  "major_required",
  "major_elective",
  "practical",
  "external",
] as const;

const courseKey = z
  .string()
  .trim()
  .min(2)
  .transform((s) => s.toUpperCase().replace(/\s+/g, ""));

const reqGroup = z.array(courseKey).min(1);
const reqGroups = z.array(reqGroup).default([]);

export const courseSchema = z.object({
  id: courseKey,
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  nameAr: z.string().trim().min(1).nullable().default(null),
  credits: z.number().finite().min(0).max(30),
  requirementGroup: z.enum(REQUIREMENT_GROUPS),
  prerequisites: reqGroups,
  corequisites: reqGroups,
  standing: z.enum(["junior", "senior"]).nullable().default(null),
  external: z.boolean().default(false),
  alsoIn: z.array(z.string().trim().min(1)).default([]),
  needsReview: z.boolean().default(false),
  note: z.string().trim().min(1).nullable().default(null),
});

export const majorSheetSchema = z.object({
  program: z.string().trim().min(1).nullable().default(null),
  totalCredits: z.number().finite().min(0).max(400).nullable().default(null),
  warnings: z.array(z.string()).default([]),
  courses: z.array(courseSchema).min(1),
});

export type ReqGroups = string[][];
export type Course = z.infer<typeof courseSchema>;
export type MajorSheet = z.infer<typeof majorSheetSchema>;

export const EXTRACT_TOOL_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["courses"],
  properties: {
    program: { type: ["string", "null"] },
    totalCredits: { type: ["number", "null"] },
    warnings: { type: "array", items: { type: "string" } },
    courses: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "code", "name", "credits", "requirementGroup"],
        properties: {
          id: { type: "string", description: "Code uppercased, spaces removed, e.g. INFS221" },
          code: { type: "string", description: "Display form, e.g. 'INFS 221'" },
          name: { type: "string", description: "English course name" },
          nameAr: { type: ["string", "null"] },
          credits: { type: "number" },
          requirementGroup: { type: "string", enum: [...REQUIREMENT_GROUPS] },
          prerequisites: {
            type: "array",
            description: "AND-groups; each group is a list of OR-alternative course ids",
            items: { type: "array", items: { type: "string" }, minItems: 1 },
          },
          corequisites: {
            type: "array",
            items: { type: "array", items: { type: "string" }, minItems: 1 },
          },
          standing: { type: ["string", "null"], enum: ["junior", "senior", null] },
          external: { type: "boolean" },
          alsoIn: { type: "array", items: { type: "string" } },
          needsReview: { type: "boolean" },
          note: { type: ["string", "null"] },
        },
      },
    },
  },
} as const;

export function toCourseKey(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

// ---- edges + validation (mirror of graph.ts) ----

export type EdgeKind = "prerequisite" | "corequisite";
export type CourseEdge = { sourceKey: string; targetKey: string; kind: EdgeKind; isAlternative: boolean };

function edgesFromGroups(targetKey: string, groups: ReqGroups, kind: EdgeKind): CourseEdge[] {
  const out: CourseEdge[] = [];
  for (const group of groups) {
    const isAlternative = group.length > 1;
    for (const rawSource of group) {
      const sourceKey = toCourseKey(rawSource);
      if (!sourceKey || sourceKey === targetKey) continue;
      out.push({ sourceKey, targetKey, kind, isAlternative });
    }
  }
  return out;
}

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

const REMEDIAL_RE = /\b0\d{2}[A-Z]?$/;
const looksRemedial = (key: string) => REMEDIAL_RE.test(key);
function spacedCode(key: string): string {
  const m = key.match(/^([A-Z]+)\s*(\d.*)$/);
  return m ? `${m[1]} ${m[2]}` : key;
}

export type ValidationResult = { courses: Course[]; edges: CourseEdge[]; warnings: string[] };

export function validateSheet(sheet: MajorSheet): ValidationResult {
  const warnings = [...sheet.warnings];

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
      name: existing.name || c.name,
      nameAr: existing.nameAr ?? c.nameAr,
      credits: existing.credits || c.credits,
      prerequisites: existing.prerequisites.length ? existing.prerequisites : c.prerequisites,
      corequisites: existing.corequisites.length ? existing.corequisites : c.corequisites,
      alsoIn: [...new Set([...existing.alsoIn, ...c.alsoIn, c.code])].filter((s) => s !== existing.code),
      needsReview: existing.needsReview || c.needsReview,
    });
  }

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

  const cyclic = findCycleEdges(courses, edges.filter((e) => e.kind === "prerequisite"));
  for (const e of cyclic) {
    warnings.push(`Prerequisite cycle: ${spacedCode(e.sourceKey)} → ${spacedCode(e.targetKey)} (please verify the sheet).`);
  }

  const keys = new Set(courses.map((c) => c.id));
  edges = edges.filter((e) => keys.has(e.sourceKey) && keys.has(e.targetKey));

  return { courses, edges, warnings };
}

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
  if (removed.size === keys.size) return [];
  return prereqEdges.filter((e) => !removed.has(e.sourceKey) && !removed.has(e.targetKey));
}

// The extraction system prompt (doc Section 4) — verbatim.
export const EXTRACTION_SYSTEM_PROMPT = `You extract structured degree-plan data from a university "major sheet". Output ONLY by calling the extract_major_sheet tool with valid arguments. Never add prose.

Rules:
- COURSE KEYS: id = course code uppercased with spaces removed (e.g. "INFS 221" -> "INFS221"). Keep the spaced form in "code".
- PREREQUISITE LOGIC:
  - A slash "/" between codes means ALTERNATIVES -> one group with multiple options (OR). Example "MATH 110/INFS 290" -> [["MATH110","INFS290"]].
  - A comma "," or a newline between codes means ALL REQUIRED (AND) -> separate groups. Example "BUSG 101, ACCT 130" -> [["BUSG101"],["ACCT130"]].
- STANDING: "Senior Standing" / "Junior Standing" is NOT a course. Put it in the "standing" field ("senior" or "junior") and do NOT create an edge for it. A course can have both real prerequisites and a standing requirement.
- COLOR LEGEND: Many sheets color-code the requisite column. If a legend says one color = pre-requisite and another = co-requisite (commonly maroon/red = prerequisite, green = corequisite), route co-requisite codes into "corequisites" and prerequisites into "prerequisites". If you cannot reliably determine color, put everything in "prerequisites", set that course's needsReview = true, and add a warning.
- BILINGUAL: If the sheet has Arabic and English, capture the English name in "name" and the Arabic name in "nameAr". Otherwise nameAr = null.
- EXTERNAL/REMEDIAL: If a prerequisite code is referenced but never appears as its own listed course (e.g. a remedial ENGL 095 / MATH 095, or a placement test), still include it as a node with external = true. Represent placement tests as a "note" ("or placement test"), NOT as a fake course node.
- CROSS-LISTED: If the same course code appears in two sections, emit ONE course node and list the extra sections in "alsoIn". Do not duplicate.
- NEVER INVENT a prerequisite. If a cell is unreadable or ambiguous, leave the field empty, set needsReview = true, and describe the uncertainty in "warnings".
- credits must be a number. requirementGroup must be one of the allowed enum values; map the sheet's section headings onto them and keep the original heading in "note".
- Populate top-level "program", "totalCredits", and "warnings".`;
