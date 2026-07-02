// Client-side helpers for the major-sheet pipeline: kick off the async parse job,
// load a parsed graph back from Supabase, and (fallback) synthesize a graph from
// the catalog when the student has no AI-parsed sheet yet.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course } from "@/lib/schema/majorSheet";
import { toCourseKey } from "@/lib/schema/majorSheet";
import { deriveEdges, type CourseEdge } from "@/lib/majorSheet/graph";
import type { CourseTuple } from "@/lib/catalog";

export type SheetGraph = {
  sheetId: string;
  program: string | null;
  totalCredits: number | null;
  warnings: string[];
  courses: Course[];
  edges: CourseEdge[];
};

// Map a DB `courses` row back into the shared Course shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCourse(r: any): Course {
  return {
    id: r.course_key,
    code: r.code ?? r.course_key,
    name: r.name ?? r.course_key,
    nameAr: r.name_ar ?? null,
    credits: Number(r.credits) || 0,
    requirementGroup: r.requirement_group ?? "major_required",
    prerequisites: (r.prerequisites ?? []) as string[][],
    corequisites: (r.corequisites ?? []) as string[][],
    standing: r.standing ?? null,
    external: Boolean(r.is_external),
    alsoIn: (r.also_in ?? []) as string[],
    needsReview: Boolean(r.needs_review),
    note: r.note ?? null,
  };
}

// The most recent successfully-parsed sheet for the current user, with its
// courses + edges. Returns null when there's nothing parsed yet.
export async function loadLatestSheetGraph(supabase: SupabaseClient, userId: string): Promise<SheetGraph | null> {
  const { data: sheet } = await supabase
    .from("major_sheets")
    .select("id, program_name, total_credits, warnings")
    .eq("user_id", userId)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sheet) return null;

  const [{ data: courseRows }, { data: edgeRows }] = await Promise.all([
    supabase.from("courses").select("*").eq("sheet_id", sheet.id),
    supabase.from("course_edges").select("*").eq("sheet_id", sheet.id),
  ]);

  const courses = (courseRows ?? []).map(rowToCourse);
  const edges: CourseEdge[] = (edgeRows ?? []).map((e) => ({
    sourceKey: e.source_key,
    targetKey: e.target_key,
    kind: e.kind,
    isAlternative: Boolean(e.is_alternative),
  }));

  return {
    sheetId: sheet.id,
    program: sheet.program_name ?? null,
    totalCredits: sheet.total_credits ?? null,
    warnings: (sheet.warnings ?? []) as string[],
    courses,
    // Prefer stored edges; if none were persisted, derive them from the groups.
    edges: edges.length ? edges : deriveEdges(courses),
  };
}

const numOf = (code: string) => {
  const m = code.match(/(\d{3})/);
  return m ? parseInt(m[1], 10) : 100;
};
const deptOf = (code: string) => code.split(" ")[0];

// Fallback graph when there's no AI-parsed sheet: treat each course's nearest
// lower-numbered same-department sibling as a single prerequisite. Mirrors the
// heuristic the app already used, but expressed in the shared Course/edge shape so
// the same renderer draws both real and fallback graphs.
export function catalogToGraph(planCourses: CourseTuple[]): { courses: Course[]; edges: CourseEdge[] } {
  const byDept = new Map<string, CourseTuple[]>();
  for (const c of planCourses) {
    const d = deptOf(c[0]);
    if (!byDept.has(d)) byDept.set(d, []);
    byDept.get(d)!.push(c);
  }
  for (const list of byDept.values()) list.sort((a, b) => numOf(a[0]) - numOf(b[0]) || a[0].localeCompare(b[0]));

  const prereqOf = (code: string): string[][] => {
    const list = byDept.get(deptOf(code)) ?? [];
    const n = numOf(code);
    let prev: string | null = null;
    for (const m of list) {
      if (m[0] === code) break;
      if (numOf(m[0]) < n) prev = m[0];
    }
    return prev ? [[toCourseKey(prev)]] : [];
  };

  const courses: Course[] = planCourses.map((c) => ({
    id: toCourseKey(c[0]),
    code: c[0],
    name: c[1],
    nameAr: c[2] && c[2] !== c[1] ? c[2] : null,
    credits: c[3],
    requirementGroup: "major_required",
    prerequisites: prereqOf(c[0]),
    corequisites: [],
    standing: null,
    external: false,
    alsoIn: [],
    needsReview: false,
    note: null,
  }));

  return { courses, edges: deriveEdges(courses) };
}

// Upload a file straight to the private bucket, create a pending sheet row, and
// invoke the extraction job. Returns the new sheetId to poll.
export async function startSheetParse(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<string> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const up = await supabase.storage.from("major-sheets").upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (up.error) throw new Error(up.error.message);

  const { data: row, error: insErr } = await supabase
    .from("major_sheets")
    .insert({ title: file.name, source_file_path: path, source_mime: file.type || null, status: "pending" })
    .select("id")
    .single();
  if (insErr || !row) throw new Error(insErr?.message ?? "Could not create sheet row");

  // Fire the async extraction job WITHOUT awaiting its full 20–40s duration; the
  // caller polls major_sheets.status instead. The function records failures onto
  // the row, so a dropped promise here never hides an error.
  void supabase.functions.invoke("parse-major-sheet", { body: { sheetId: row.id } }).catch(() => {});
  return row.id as string;
}

export type SheetStatus = "pending" | "processing" | "ready" | "failed";

export async function getSheetStatus(
  supabase: SupabaseClient,
  sheetId: string,
): Promise<{ status: SheetStatus; error: string | null }> {
  const { data } = await supabase.from("major_sheets").select("status, error").eq("id", sheetId).maybeSingle();
  return { status: (data?.status as SheetStatus) ?? "pending", error: data?.error ?? null };
}
