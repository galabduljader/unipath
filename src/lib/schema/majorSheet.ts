// Canonical data contract for a parsed major sheet — the single source of truth
// for the shape of extracted degree-plan data. Defined once as a Zod schema (for
// runtime validation of untrusted model output) and re-exported as TS types, then
// reused everywhere: extraction validation, DB writes, and graph building.
//
// Prerequisite model (the core design decision):
//   `prerequisites` is a list of AND-groups; each group is a list of OR-alternatives.
//   ALL groups must be satisfied (AND); within a group ANY one option satisfies it (OR).
//   `corequisites` uses the identical structure.
//     "INFS 221" needs MATH 110 OR INFS 290  -> [["MATH110","INFS290"]]
//     "BUSG 250" needs BUSG 101 AND ACCT 130 -> [["BUSG101"],["ACCT130"]]
//     "INFS 380" needs INFS 365              -> [["INFS365"]]
//     no prerequisites                       -> []

import { z } from "zod";

// Section headings on real sheets vary; we map them onto this fixed enum and keep
// the original label in `note`.
export const REQUIREMENT_GROUPS = [
  "gen_ed",
  "college_basic",
  "college_advanced",
  "major_required",
  "major_elective",
  "practical",
  "external",
] as const;
export type RequirementGroup = (typeof REQUIREMENT_GROUPS)[number];

export const STANDINGS = ["junior", "senior"] as const;
export type Standing = (typeof STANDINGS)[number];

// A course key is the code uppercased with all whitespace removed — the stable
// graph key (e.g. "INFS 221" -> "INFS221"). Kept ≥2 chars so junk rows drop out.
const courseKey = z
  .string()
  .trim()
  .min(2)
  .transform((s) => s.toUpperCase().replace(/\s+/g, ""));

// One AND-group: a non-empty list of OR-alternative course keys.
const reqGroup = z.array(courseKey).min(1);
// The full AND/OR structure: a list of AND-groups.
const reqGroups = z.array(reqGroup).default([]);

export const courseSchema = z.object({
  // code with spaces removed, uppercased — stable key (e.g. "INFS221")
  id: courseKey,
  // display form (e.g. "INFS 221")
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  // Arabic name, or null when the sheet is English-only
  nameAr: z.string().trim().min(1).nullable().default(null),
  credits: z.number().finite().min(0).max(30),
  requirementGroup: z.enum(REQUIREMENT_GROUPS),
  prerequisites: reqGroups,
  corequisites: reqGroups,
  // "Senior/Junior Standing" is NOT a course — captured here, never as an edge.
  standing: z.enum(STANDINGS).nullable().default(null),
  // true = remedial/placement course, not part of the degree credits
  external: z.boolean().default(false),
  // sections where cross-listed (avoids duplicate nodes)
  alsoIn: z.array(z.string().trim().min(1)).default([]),
  // true when extraction was low-confidence for this row
  needsReview: z.boolean().default(false),
  // free-form note, e.g. "MATH 110 or placement test" or the original heading
  note: z.string().trim().min(1).nullable().default(null),
});

export const majorSheetSchema = z.object({
  program: z.string().trim().min(1).nullable().default(null),
  totalCredits: z.number().finite().min(0).max(400).nullable().default(null),
  // human-readable notes about anything uncertain
  warnings: z.array(z.string()).default([]),
  courses: z.array(courseSchema).min(1),
});

// The AND/OR groups type, shared by prerequisites and corequisites.
export type ReqGroups = string[][];
export type Course = z.infer<typeof courseSchema>;
export type MajorSheet = z.infer<typeof majorSheetSchema>;

// The JSON Schema handed to the extraction model as the `extract_major_sheet`
// tool's input_schema. Kept hand-written (not z.toJSONSchema) so it stays legible
// in the extraction prompt and independent of the Zod version's emitter quirks.
// The Zod schema above remains the authoritative validator of whatever comes back.
export const EXTRACT_TOOL_INPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["courses"],
  properties: {
    program: { type: ["string", "null"], description: "Full program/degree name" },
    totalCredits: { type: ["number", "null"], description: "Total credits for the degree" },
    warnings: {
      type: "array",
      items: { type: "string" },
      description: "Human-readable notes about anything uncertain or unreadable",
    },
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
          nameAr: { type: ["string", "null"], description: "Arabic name, or null if English-only" },
          credits: { type: "number" },
          requirementGroup: { type: "string", enum: [...REQUIREMENT_GROUPS] },
          prerequisites: {
            type: "array",
            description: "AND-groups; each group is a list of OR-alternative course ids",
            items: { type: "array", items: { type: "string" }, minItems: 1 },
          },
          corequisites: {
            type: "array",
            description: "Same AND/OR structure as prerequisites",
            items: { type: "array", items: { type: "string" }, minItems: 1 },
          },
          standing: { type: ["string", "null"], enum: ["junior", "senior", null] },
          external: { type: "boolean", description: "true = remedial/placement, not part of degree credits" },
          alsoIn: { type: "array", items: { type: "string" }, description: "Sections where cross-listed" },
          needsReview: { type: "boolean", description: "true if this row was low-confidence" },
          note: { type: ["string", "null"], description: "e.g. 'MATH 110 or placement test'" },
        },
      },
    },
  },
} as const;

// Normalize any raw course code into the stable key form. Exported so the client,
// graph utils, and DB writers all agree on how "CS 101"/"cs-101" -> "CS101".
export function toCourseKey(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}
