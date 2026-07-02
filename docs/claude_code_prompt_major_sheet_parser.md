# Claude Code Prompt — Major Sheet → Prerequisite Graph

> Paste everything below into Claude Code. It is written as direct instructions to the agent.

---

You are implementing a feature in an existing **Next.js (App Router) + Supabase + Vercel** app called UniPath. A university student uploads their degree "major sheet" **in any format** (PDF, image/photo, screenshot, Word, Excel, or CSV). The app must:

1. Extract every course with its credits, prerequisites, and corequisites cleanly.
2. Store the result in Supabase (per-user, RLS-protected).
3. Render it as an org-chart-style **prerequisite graph** using React Flow + Dagre, with color-coded node statuses and click-to-highlight prerequisite/dependent chains.

Do **not** attempt to regex-parse the sheet. Layouts vary wildly and sheets are often bilingual (English + Arabic) with color-coded legends. Use **Claude (Anthropic API) as the extraction engine** with a strict JSON schema enforced via tool use. Follow the architecture and data contract below exactly.

---

## 1. Canonical data contract

This is the single source of truth for the shape of parsed data. Define it once as a shared TypeScript type **and** a Zod schema (`lib/schema/majorSheet.ts`) and reuse it everywhere (extraction validation, DB writes, graph building).

**Prerequisite model — read this carefully, it is the core design decision:**

`prerequisites` is a list of **AND-groups**; each group is a list of **OR-alternatives**. All groups must be satisfied (AND); within a group, any one option satisfies it (OR). `corequisites` uses the identical structure.

```jsonc
{
  "program": "Bachelor of BA in Information Systems",
  "totalCredits": 126,
  "warnings": [],           // human-readable notes about anything uncertain
  "courses": [
    {
      "id": "INFS221",            // code with spaces removed, uppercased — stable key
      "code": "INFS 221",         // display form
      "name": "Business Programming 1",
      "nameAr": "برمجة الأعمال 1", // null if the sheet is English-only
      "credits": 3,
      "requirementGroup": "major_required", // see enum below
      "prerequisites": [["MATH110", "INFS290"]], // MATH110 OR INFS290
      "corequisites": [],
      "standing": null,           // null | "junior" | "senior"
      "external": false,          // true = remedial/placement course, not part of the degree credits
      "alsoIn": [],               // sections where cross-listed (avoids duplicate nodes)
      "needsReview": false,       // true if extraction was low-confidence for this row
      "note": null                // e.g. "MATH 110 or placement test"
    }
  ]
}
```

`requirementGroup` enum: `gen_ed | college_basic | college_advanced | major_required | major_elective | practical | external`. If the sheet uses different section names, map them and record the original label in `note`.

Worked examples of the prerequisite model:
- `"INFS 221"` needs `MATH 110` **or** `INFS 290` → `[["MATH110","INFS290"]]`
- `"BUSG 250"` needs `BUSG 101` **and** `ACCT 130` → `[["BUSG101"],["ACCT130"]]`
- `"INFS 380"` needs `INFS 365` → `[["INFS365"]]`
- No prerequisites → `[]`

---

## 2. Supabase schema

Create a migration. All tables are **RLS-protected** and scoped to `auth.uid()`.

**Storage:** a **private** bucket `major-sheets`. Storage RLS: a user may only read/write objects under a path prefixed with their own `auth.uid()`.

**Tables:**

- `major_sheets`
  - `id uuid pk default gen_random_uuid()`
  - `user_id uuid not null references auth.users` (default `auth.uid()`)
  - `title text`, `program_name text`, `total_credits int`
  - `source_file_path text` (storage key), `source_mime text`
  - `status text not null default 'pending'` — enum-like: `pending | processing | ready | failed`
  - `error text`, `warnings jsonb default '[]'`
  - `raw_extraction jsonb` (the full model output, kept for debugging/re-render)
  - `created_at timestamptz default now()`

- `courses`
  - `id uuid pk`, `sheet_id uuid references major_sheets on delete cascade`
  - `course_key text not null` (the schema `id`, e.g. `INFS221`), `code text`, `name text`, `name_ar text`
  - `credits int`, `requirement_group text`, `standing text`, `is_external bool default false`
  - `prerequisites jsonb not null default '[]'`  ← the AND/OR groups, source of truth
  - `corequisites jsonb not null default '[]'`
  - `also_in jsonb default '[]'`, `needs_review bool default false`, `note text`
  - unique `(sheet_id, course_key)`

- `course_edges` (flat, **derived** from the groups — used for fast graph queries + highlighting)
  - `id uuid pk`, `sheet_id uuid references major_sheets on delete cascade`
  - `source_key text not null`, `target_key text not null`
  - `kind text not null` — `prerequisite | corequisite`
  - `is_alternative bool default false` (true when it came from a multi-option OR group)
  - index on `(sheet_id, target_key)` and `(sheet_id, source_key)`

Write RLS policies so every select/insert/update/delete on `courses` and `course_edges` joins back to a `major_sheets` row owned by the caller.

---

## 3. Parsing pipeline

The flow is designed around two hard Vercel constraints: **serverless request bodies are capped ~4.5MB**, and **functions time out** (extraction of a big PDF can take 20–40s). So files never travel through the API request body, and extraction is a status-tracked async job — not a blocking request.

1. **Upload (client):** request a signed upload URL from Supabase Storage and upload the file directly to the `major-sheets` bucket at `{auth.uid()}/{uuid}.{ext}`. Do **not** POST the file to a Next.js route.
2. **Kick off parse (client → server):** `POST /api/sheets` with `{ storagePath, mime, title? }`. Server inserts a `major_sheets` row with `status='pending'`, returns `sheetId`.
3. **Extraction job (server):** a Route Handler (`app/api/sheets/[id]/parse/route.ts`) with `export const maxDuration = 300` (raise on Vercel Pro). Set status `processing`, then:
   - Download the file from Storage (server-side, service role key — never exposed to client).
   - **Prepare model input by type:**
     - PDF or image → pass as a `document` / `image` content block to Claude (vision). Base64-encode server-side. Split very large PDFs by page if needed.
     - `.xlsx/.csv` → parse to text/markdown table with SheetJS first, then send text.
     - `.docx` → extract text with `mammoth`, then send text.
   - Call the Anthropic API with the **extraction prompt** (Section 4) and force structured output via a single tool `extract_major_sheet` whose `input_schema` is the Zod schema from Section 1, with `tool_choice: { type: "tool", name: "extract_major_sheet" }`. Use model `claude-sonnet-4-6` (strong at vision + structured extraction). Consider `claude-haiku-4-5` as a cheaper path for clean text-only sheets.
   - **The API key lives only in a server env var.** Never ship it to the client, never put it in `NEXT_PUBLIC_*`.
4. **Validate:** parse the tool output with Zod. Then run graph validation (Section 5). Collect issues into `warnings`.
5. **Persist:** upsert `courses`, then derive and insert `course_edges` from each course's `prerequisites`/`corequisites` groups. Store the full model output in `raw_extraction`. Set status `ready` (or `failed` + `error`).
6. **Render:** client polls `major_sheets.status` (or subscribes via Supabase Realtime) and, once `ready`, fetches courses + edges and renders the graph.

Make re-upload **idempotent**: re-parsing a sheet replaces its `courses` and `course_edges` (cascade delete + reinsert) so the student can fix a bad scan.

---

## 4. Extraction prompt (nested — this is the system prompt for the extraction model)

Use this verbatim as the system prompt for the `extract_major_sheet` tool call. Feed the sheet (image/pdf/text) as the user message.

```
You extract structured degree-plan data from a university "major sheet". Output ONLY by calling the extract_major_sheet tool with valid arguments. Never add prose.

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
- Populate top-level "program", "totalCredits", and "warnings".
```

---

## 5. Graph validation (run after Zod, before writing to DB)

- **Dangling references:** every code appearing in any prerequisite/corequisite group must resolve to a course node. If not, either mark it `external:true` (if clearly remedial) or add a warning listing the unresolved code.
- **Deduplicate** course keys; merge `alsoIn` on collision.
- **Cycle detection:** a valid prerequisite DAG must be acyclic. Run a topological check; if a cycle exists, break the reported edges out into `warnings` (do not silently drop them) so the student can correct the source.
- **Roots vs gates:** courses with empty `prerequisites` and no `standing` are graph roots. Courses with only a `standing` gate and no course prerequisites are also roots (render the gate as a badge, not a parent node).

---

## 6. Graph rendering (React Flow + Dagre)

Extend the existing `<PrerequisiteMap />` component. Feed it courses + `course_edges`.

- **Nodes:** one per course. Build React Flow `nodes` from `courses`, `edges` from `course_edges`.
- **Layout:** Dagre, `rankdir: 'TB'`, nodes ranked by prerequisite depth so foundations sit at top and capstones at bottom. Run Dagre in a layout util and write `position` back onto each node; recompute on data change.
- **Node color:** by student progress status — `locked` (prereqs unmet), `available` (prereqs met, not taken), `in_progress`, `completed`. Compute `available` with:
  `course.prerequisites.every(group => group.some(key => completed.has(key)))` (and standing satisfied). Provide a secondary color mode by `requirementGroup`.
- **Edge styles:** solid = prerequisite; use a distinct style (dashed) for edges where `is_alternative = true`, and a dotted/different color for `kind = 'corequisite'`. Add a small legend.
- **Standing gates:** render as a badge on the node (e.g. "Senior standing"), never as a parentless node.
- **Click-to-highlight:** clicking a node highlights its full transitive **ancestor** chain (everything it depends on) and **descendant** chain (everything that depends on it), dimming the rest. Precompute adjacency from `course_edges` for both directions; do the traversal client-side (BFS/DFS), no server round-trip.

---

## 7. Security & correctness checklist

- Anthropic API key is server-only; Supabase **service role** key server-only. Client uses the anon key + RLS.
- Validate uploaded file type and size before parsing; reject anything not in the allowed MIME list.
- All DB access goes through RLS; never bypass it on client paths.
- Signed URLs for upload/download; storage objects namespaced by `auth.uid()`.
- Extraction output is untrusted until it passes Zod + graph validation — never write raw model output straight into typed tables.

---

## 8. Build order (milestones)

1. Migration: tables, RLS, storage bucket + policies.
2. `lib/schema/majorSheet.ts`: shared TS type + Zod schema.
3. Signed-upload flow + `POST /api/sheets` (creates pending row).
4. `POST /api/sheets/[id]/parse`: download → model input prep (pdf/image/xlsx/docx/csv) → Anthropic tool-use call → Zod → graph validation → persist → status.
5. Client: upload UI, status polling/Realtime, error + `needsReview` surfacing.
6. `<PrerequisiteMap />`: Dagre layout, status colors, alt/coreq edge styles, click-to-highlight chains.
7. Re-parse (idempotent replace) + a "review & correct" panel for `needsReview` courses.

**Done when:** a student can upload a PDF, an Excel file, and a phone photo of the same sheet and get an equivalent, correctly-linked prerequisite graph; AND/OR prerequisites render distinctly; corequisites are separated from prerequisites; standing gates appear as badges; clicking a course highlights its full upstream and downstream chains; and everything is isolated per user by RLS.
```
