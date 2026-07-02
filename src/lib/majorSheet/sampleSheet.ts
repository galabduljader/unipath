// Built-in sample major sheet: the real "Bachelor of BA in Information Systems"
// (BAIS) degree plan, used as the app's default prerequisite graph until a student
// uploads and parses their own sheet. Sourced from docs/unipath_bais_courses.json
// and run through the SAME Zod + graph validation as live extraction output, so it
// exercises the whole pipeline (AND/OR prerequisites, OR-alternative edges, standing
// gates, external/remedial nodes) with zero backend.

import rawSheet from "@/lib/majorSheet/baisSheet.json";
import { majorSheetSchema } from "@/lib/schema/majorSheet";
import { validateSheet, type CourseEdge } from "@/lib/majorSheet/graph";
import type { SheetGraph } from "@/lib/majorSheet/client";

function buildSample(): SheetGraph {
  // The JSON carries a few extra fields (section, model, …) that Zod strips; it is
  // otherwise the canonical contract. Validate it like any untrusted extraction.
  const parsed = majorSheetSchema.safeParse(rawSheet);
  if (!parsed.success) {
    // Should never happen for the checked-in file; fail loud in dev, empty in prod.
    if (process.env.NODE_ENV !== "production") {
      throw new Error("Sample BAIS sheet failed schema validation: " + parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
    }
    return { sheetId: "sample-bais", program: null, totalCredits: null, warnings: [], courses: [], edges: [] as CourseEdge[] };
  }

  const { courses, edges, warnings } = validateSheet(parsed.data);
  return {
    sheetId: "sample-bais",
    program: parsed.data.program,
    totalCredits: parsed.data.totalCredits,
    warnings,
    courses,
    edges,
  };
}

export const SAMPLE_SHEET: SheetGraph = buildSample();
