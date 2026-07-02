# Claude Code Prompt — Course Exploration Flow

> Paste into Claude Code. Written as direct instructions to the agent. This builds on the existing major-sheet parsing feature and its data model (`courses`, `course_edges`, the AND-OR prerequisite groups). If that schema is not yet present, read it first — this prompt assumes it.

---

You are building the **student-facing exploration flow** for a parsed degree plan. The student must be able to open the prerequisite graph, pick any course, and clearly understand three distinct relationships around it: **what it requires (prerequisites), what it unlocks (dependents), and what must be taken alongside it (corequisites)** — plus whether *they personally* can take it yet, and if not, exactly why.

Get the graph semantics below exactly right. They are subtle and easy to collapse incorrectly.

---

## 1. Graph model — relay and respect these rules precisely

- **Prerequisite edges form a DAG** (directed, acyclic). Direction is `prerequisite → course`.
- **"Unlocks" is the reverse direction** of prerequisite edges. Course A unlocks course B iff B lists A in one of its prerequisite groups. Build a **reverse adjacency map** from `course_edges` (kind = `prerequisite`) once, and reuse it.
- **Prerequisites are AND-groups of OR-alternatives.** `prerequisites: [[a, b], [c]]` means `(a OR b) AND (c)`. Never flatten this away — the flat `course_edges` table is for drawing and traversal; the grouped `jsonb` is for logic.
- **Corequisites are NOT prerequisites.** They mean "take together or before," can be **mutual (cyclic)**, and must be kept out of the DAG, out of acyclicity checks, and out of Dagre ranking. Treat them as a **same-rank / undirected** relationship. Render them, never traverse them as precedence.
- **Standing** (`junior`/`senior`) is a **node attribute**, not an edge. It gates eligibility but never appears as a node or an arrow.

### The "unlocks" nuance (do not get this wrong)

There are two different questions, and the UI needs both:

1. **Structural — "what is this a prerequisite for?"** The direct dependents (reverse edges). Always the same regardless of student progress. This is what you show as "Unlocks" in the course panel.
2. **Dynamic — "what does taking this newly make available?"** A course C is *one* option in a dependent D's group. Taking C only *fully* unlocks D if every OTHER prerequisite group of D is already satisfied and D's standing is met. So compute "newly available after taking C" separately, per student, by re-running the eligibility check with C added to the completed set and diffing.

Show (1) as the stable "Unlocks" list. Optionally badge the subset that satisfies (2) as "newly available."

---

## 2. Data you already have

- `courses`: `course_key`, `code`, `name`, `name_ar`, `credits`, `requirement_group`, `standing`, `is_external`, `prerequisites` (jsonb AND-OR groups), `corequisites` (jsonb), `note`, `needs_review`.
- `course_edges`: `source_key`, `target_key`, `kind` (`prerequisite` | `corequisite`), `is_alternative` (came from an OR group).
- Student progress (create if missing): a `student_courses` table mapping `user_id` + `course_key` → `status` (`completed` | `in_progress` | `planned`), RLS-scoped. Derive `available`/`locked` at runtime, don't store them.

---

## 3. Eligibility logic (single source of truth)

Write one pure function and use it everywhere (node colors, panel status, "why locked", newly-unlocked diffs).

```ts
type Status = 'completed' | 'in_progress' | 'available' | 'locked';

function evaluate(course, completedKeys: Set<string>, student): {
  status: Status;
  unmet: string[][];      // the prerequisite groups NOT yet satisfied
  standingMet: boolean;
} {
  const standingMet = satisfiesStanding(course.standing, student);
  const unmet = course.prerequisites.filter(
    group => !group.some(key => completedKeys.has(key))
  );
  const prereqsMet = unmet.length === 0;
  // status precedence: explicit student status wins, else derive
  // available only if prereqsMet && standingMet
  return { status, unmet, standingMet };
}
```

- **Locked reason** must be phrased respecting AND/OR: for each unmet group, "need **one of**: X, Y"; multiple unmet groups are joined with "and". If `standingMet` is false, add "requires {senior|junior} standing". Never say "need X and Y" when the group is an OR.

---

## 4. The flow & states

**A. Map view (default).** Full Dagre DAG (prereq edges only for layout), nodes colored by `status`, corequisite links drawn but excluded from ranking. Persistent legend. A search box to jump to any course by code/name.

**B. Focus mode (a course is selected).** The selected course is emphasized; everything else responds to it:

- **Upstream (prerequisites):** highlight the transitive ancestor chain — everything this course depends on — in one visual treatment (e.g. cool color, arrows flowing *into* the focused course).
- **Downstream (unlocks):** highlight the transitive descendant chain — everything that depends on this — in a distinct treatment (e.g. warm color, arrows flowing *out*).
- **Corequisites:** link with a dotted, non-directional style at the same rank; label as "co-req". Do not fold these into the up/down chains.
- Everything unrelated **dims**.
- The **detail panel** opens (Section 5).
- Provide a clear way to exit focus (click background / back / Esc) and a breadcrumb of recently focused courses.

**C. Direct vs transitive toggle.** Default to showing **direct** prerequisites and **direct** unlocks (immediate neighbors) to avoid overwhelming the student; offer a toggle to expand to the full transitive chains. Compute transitive sets with BFS over the correct adjacency map (forward for prereqs, reverse for unlocks) — client-side, no server round-trip.

---

## 5. Course detail panel (the core deliverable)

A side drawer that opens on select. It must make the three relationships unmistakably distinct. Contents:

- **Header:** `code` + `name`, with `name_ar` shown when present; `credits`; `requirement_group` label; a `needs_review` flag if the extraction was uncertain (with an inline "correct this" affordance).
- **Your status:** one of completed / in progress / available / locked, with the **precise locked reason** from Section 3 ("You still need one of: MATH 110, INFS 290").
- **Prerequisites:** render the AND-OR groups literally and legibly. Each group is a row; options within a group are joined by "or"; groups are stacked as "and". Mark each option's own status (✓ completed, dot available, lock locked) so the student sees at a glance which branch to pursue. If empty: "No prerequisites — foundation course."
- **Standing requirement:** a badge if `standing` is set ("Requires senior standing").
- **Corequisites:** a separate, clearly-labelled section: "Take alongside (co-requisite): …". Never mixed into prerequisites. If mutual, say "co-requisite (either order)".
- **Unlocks:** the direct dependents (reverse edges). For each, show its code/name and, if applicable, a "newly available" badge when completing THIS course would flip it to available (the dynamic check from Section 1). If it unlocks nothing: "Terminal course — unlocks nothing further."
- Each related course in the panel is clickable and re-focuses the map onto it (so the panel doubles as a navigation surface).

---

## 6. Visual language (keep it consistent with the map)

- **Prerequisite edges:** solid; **OR-alternative edges** (`is_alternative = true`): dashed.
- **Corequisite edges:** dotted, distinct color, no arrowhead (or double-headed).
- **Upstream vs downstream highlight:** two different accent colors so "requires" and "unlocks" are never confused; reinforce with arrow direction.
- **Status colors:** completed, in-progress, available, locked — four distinct fills, each paired with an icon (not color alone) for accessibility.
- Always-visible legend covering: the four statuses, solid/dashed (AND/OR), dotted (co-req), and the upstream/downstream accents.

---

## 7. Edge & empty states

- **Root courses** (no prereqs, no standing): render as entry points; panel says "foundation course".
- **Pure standing gates** (only a standing requirement, no course prereqs): still a root; show the standing badge, no phantom parent node.
- **Terminal courses** (unlock nothing): panel states so.
- **External/remedial nodes** (`is_external`): visually de-emphasized; allow hiding via a toggle.
- **`needs_review` courses:** flagged in both node and panel so the student can correct a bad scan.
- **Cycles:** should never exist in prereqs (validated upstream). If one slips through, surface it as a warning rather than letting the highlight traversal loop — guard BFS with a visited set regardless.

---

## 8. Done when

A student can: open the map and see status at a glance; click any course and immediately distinguish what it **requires**, what it **unlocks**, and what its **co-requisites** are, each visually distinct; read a precise, AND/OR-correct reason when a course is locked; see which downstream courses would become available if they took it; toggle between direct neighbors and full transitive chains; and navigate course-to-course through the panel. Corequisites are never rendered or traversed as prerequisites, standing never appears as a node, and no highlight interaction can infinite-loop.
