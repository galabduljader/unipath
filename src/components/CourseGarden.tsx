"use client";

// The Garden — a warm, calm way to see a degree plan. Each course is a plant that
// grows with the student: seed (locked) → sprout (available) → bud (in progress) →
// flower (completed). Four gentle views (Garden, Seed Bank, Focus, Progress) plus a
// side dashboard. All course/prerequisite logic is reused from the shared model, so
// this same UI works for the mock data or a real parsed major sheet.
//
// Styling: Tailwind for layout/spacing; inline styles carry the exact warm palette
// and the status-driven colors (dynamic values Tailwind can't tree-shake safely).

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/data";
import type { Course } from "@/lib/schema/majorSheet";
import { toCourseKey, type RequirementGroup } from "@/lib/schema/majorSheet";
import { prereqDepth, type CourseEdge, type CourseStatus } from "@/lib/majorSheet/graph";
import { computeGardenStats, unlocksMap } from "@/lib/garden/stats";
import { GROUP_LABELS } from "@/lib/garden/data";

// ---- palette: the app's THEME tokens so the garden follows light/dark mode ------
const CREAM = "var(--bg)"; // page tint (container + soft fills), flips in dark mode
const SURFACE = "var(--surface)"; // card surface, flips in dark mode
const TRACK = "var(--track)"; // progress-bar track, flips in dark mode
const INK = "var(--ink-strong)"; // primary text
const MUTED = "var(--muted)"; // secondary text
const LAVENDER = "#1E8378"; // app teal accent (constant across themes)
const LAV_BG = "rgba(30,131,120,0.12)"; // translucent teal tint — readable in light & dark
const POT = "#1E5E78"; // app navy-blue planter (matches app card headers)

// Status colors drawn from the app's own course palette: teal = done,
// blue = available, amber = in progress, neutral sand = locked.
type StatusMeta = { emoji: string; en: string; ar: string; bg: string; ring: string; text: string; chip: string };
const STATUS: Record<CourseStatus, StatusMeta> = {
  completed: { emoji: "🌸", en: "Bloomed", ar: "متفتّحة", bg: "#E4F0EA", ring: "#1E8378", text: "#156B61", chip: "#CFE6DE" },
  in_progress: { emoji: "🌼", en: "Growing", ar: "تنمو", bg: "#E7F0F7", ring: "#2C6E91", text: "#235B78", chip: "#D3E3EF" },
  available: { emoji: "🌱", en: "Ready to plant", ar: "جاهزة للزراعة", bg: "#EDF4FB", ring: "#6BA6CF", text: "#2C6E91", chip: "#DCEBF6" },
  locked: { emoji: "🌰", en: "Resting", ar: "نائمة", bg: "#EFEDE6", ring: "#D8D1C2", text: "#9aa6ad", chip: "#E7E2D6" },
};

type View = "garden" | "seedbank" | "focus" | "progress";

export function CourseGarden({ courses, edges }: { courses: Course[]; edges: CourseEdge[] }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const msg = (en: string, arText: string) => (ar ? arText : en);
  const { completed, toggleCompleted } = useData();

  const [view, setView] = useState<View>("garden");
  const [selKey, setSelKey] = useState<string | null>(null);

  const completedKeys = useMemo(() => new Set([...completed].map(toCourseKey)), [completed]);
  const stats = useMemo(() => computeGardenStats(courses, edges, completed), [courses, edges, completed]);
  const statuses = stats.statuses;
  const byKey = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const unlocks = useMemo(() => unlocksMap(edges), [edges]);
  const name = (c: Course) => (ar && c.nameAr ? c.nameAr : c.name);

  const select = (key: string) => setSelKey(key);

  const VIEWS: { key: View; icon: string; en: string; ar: string }[] = [
    { key: "garden", icon: "🌿", en: "Garden", ar: "الحديقة" },
    { key: "seedbank", icon: "🌱", en: "Seed Bank", ar: "بنك البذور" },
    { key: "focus", icon: "🎯", en: "Focus", ar: "التركيز" },
    { key: "progress", icon: "📈", en: "Progress", ar: "التقدّم" },
  ];

  return (
    <div className="rounded-3xl p-4 sm:p-6" style={{ background: CREAM, color: INK }}>
      {/* header + view switch */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[22px] font-extrabold leading-tight" style={{ color: INK }}>{msg("Your Garden", "حديقتك")}</div>
          <div className="text-[13px]" style={{ color: MUTED }}>{msg("Every course is a plant. Tend it and watch your degree bloom.", "كل مادة نبتة. اعتنِ بها وشاهد شهادتك تتفتّح.")}</div>
        </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {VIEWS.map((v) => {
            const on = view === v.key;
            return (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition"
                style={{ background: on ? SURFACE : "transparent", color: on ? INK : MUTED, boxShadow: on ? "0 1px 6px rgba(80,60,30,.12)" : "none" }}
              >
                <span>{v.icon}</span>{ar ? v.ar : v.en}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 lg:flex lg:gap-6">
        <aside className="lg:order-2 lg:w-72 lg:shrink-0">
          <Dashboard stats={stats} msg={msg} name={name} onPickNext={(k) => { setView("focus"); select(k); }} />
        </aside>
        <main className="mt-5 lg:order-1 lg:mt-0 lg:flex-1">
          {view === "garden" && <GardenView courses={courses} edges={edges} statuses={statuses} name={name} ar={ar} msg={msg} pct={stats.progressPct} toggleCompleted={toggleCompleted} />}
          {view === "seedbank" && <SeedBankView courses={courses} statuses={statuses} name={name} ar={ar} onSelect={select} />}
          {view === "focus" && <FocusView courses={courses} statuses={statuses} byKey={byKey} name={name} msg={msg} onSelect={select} />}
          {view === "progress" && <ProgressView stats={stats} msg={msg} name={name} onSelect={select} />}
        </main>
      </div>

      {selKey && byKey.get(selKey) && (
        <CourseCard
          course={byKey.get(selKey)!}
          statuses={statuses}
          byKey={byKey}
          unlocks={unlocks.get(selKey) ?? []}
          completedKeys={completedKeys}
          name={name}
          ar={ar}
          msg={msg}
          onSelect={select}
          onClose={() => setSelKey(null)}
          onToggle={() => toggleCompleted(byKey.get(selKey)!.code)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Garden view — a branching plant: one branch (path) per requirement group.
// Collapsed by default (a summary pod per branch); tap a pod to grow that branch
// into its courses. Geometry mirrors the PathGarden design mockup.
// ---------------------------------------------------------------------------

const LEAF_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="#1E8378"><path d="M12 2C7 6 4 10 4 15a8 8 0 0016 0c0-5-3-9-8-13z"/></svg>`;
const LOCK_ICON = `<svg width="10" height="10" viewBox="0 0 24 24" fill="#9aa6ad"><path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 016 0z"/></svg>`;

const GARDEN_TAGS: Record<RequirementGroup, { en: string; ar: string }> = {
  gen_ed: { en: "Foundations · the roots", ar: "الأساسيات · الجذور" },
  college_basic: { en: "The essentials", ar: "الأساسيّات" },
  college_advanced: { en: "Going deeper", ar: "تعمّق أكثر" },
  major_required: { en: "Your specialty", ar: "تخصّصك" },
  major_elective: { en: "Your choices", ar: "اختياراتك" },
  practical: { en: "The finale", ar: "الختام" },
  external: { en: "Preparatory", ar: "تحضيري" },
};

type Branch = { g: RequirementGroup; label: string; items: Course[]; done: number; total: number; pct: number; anyProg: boolean; locked: boolean };

const GARDEN_KEYFRAMES = `
@keyframes gPop { from { transform: translate(-50%,-50%) scale(.82); } to { transform: translate(-50%,-50%) scale(1); } }
@keyframes gLeaf { from { transform: translate(-50%,-50%) rotate(-8deg) scale(.72); } to { transform: translate(-50%,-50%) rotate(-8deg) scale(1); } }
@keyframes gFade { from { transform: translateY(12px); opacity: .6; } to { transform: translateY(0); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .gPop, .gLeaf, .gFade { animation: none !important; } }
`;

function GardenView({ courses, edges, statuses, name, ar, msg, pct, toggleCompleted }: {
  courses: Course[]; edges: CourseEdge[]; statuses: Map<string, CourseStatus>; name: (c: Course) => string; ar: boolean; msg: (en: string, ar: string) => string; pct: number; toggleCompleted: (code: string) => void;
}) {
  const [openGroup, setOpenGroup] = useState<RequirementGroup | null>(null);
  const depth = useMemo(() => prereqDepth(courses, edges), [courses, edges]);
  const codeOf = useMemo(() => {
    const m = new Map(courses.map((c) => [c.id, c.code]));
    return (k: string) => m.get(k) ?? k;
  }, [courses]);

  // One branch per requirement group actually present (external excluded).
  const branches = useMemo<Branch[]>(() => {
    const out: Branch[] = [];
    for (const g of GROUP_ORDER) {
      if (g === "external") continue;
      const items = courses.filter((c) => c.requirementGroup === g && !c.external);
      if (!items.length) continue;
      const done = items.filter((c) => statuses.get(c.id) === "completed").length;
      const anyProg = items.some((c) => statuses.get(c.id) === "in_progress");
      const anyOpen = items.some((c) => { const s = statuses.get(c.id); return s === "available" || s === "in_progress"; });
      const locked = done === 0 && !anyOpen; // whole branch still dormant
      out.push({ g, label: GROUP_LABELS[g][ar ? "ar" : "en"], items, done, total: items.length, pct: Math.round((done / items.length) * 100), anyProg, locked });
    }
    return out;
  }, [courses, statuses, ar]);

  const open = openGroup ? branches.find((b) => b.g === openGroup) ?? null : null;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <style dangerouslySetInnerHTML={{ __html: GARDEN_KEYFRAMES }} />
      {open ? (
        <GardenBranch branch={open} statuses={statuses} depth={depth} name={name} ar={ar} msg={msg} codeOf={codeOf} onBack={() => setOpenGroup(null)} onToggle={toggleCompleted} />
      ) : (
        <GardenOverview branches={branches} pct={pct} ar={ar} onOpen={setOpenGroup} />
      )}
    </div>
  );
}

// ---- collapsed overview: pot + branches + summary pods ---------------------

function GardenOverview({ branches, pct, ar, onOpen }: { branches: Branch[]; pct: number; ar: boolean; onOpen: (g: RequirementGroup) => void }) {
  const N = branches.length;
  const geom = branches.map((b, i) => {
    const podY = N > 1 ? 348 - i * (232 / (N - 1)) : 232;
    const side = i % 2 === 0 ? -1 : 1;
    const podX = 200 + side * 100;
    const startY = podY + 34;
    const endX = podX - side * 35;
    const branchD = `M200,${startY} C${200 + side * 45},${startY - 6} ${endX - side * 25},${podY + 10} ${endX},${podY}`;
    return { b, i, podX, podY, side, branchD };
  });
  const stemTop = N ? Math.min(...geom.map((g) => g.podY)) - 24 : 150;

  return (
    <div>
      <div style={{ position: "relative", width: "100%", maxWidth: 400, margin: "0 auto", aspectRatio: "400 / 480" }}>
        <svg viewBox="0 0 400 480" width="100%" height="100%" style={{ display: "block", position: "absolute", inset: 0 }}>
          <defs>
            <linearGradient id="gPotA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={POT} /><stop offset="1" stopColor="#102A40" /></linearGradient>
            <linearGradient id="gStemA" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#1E8378" /><stop offset="1" stopColor="#8CD3C6" /></linearGradient>
          </defs>
          {/* central stem */}
          <path d={`M200,412 C196,352 204,250 200,${stemTop}`} fill="none" stroke="url(#gStemA)" strokeWidth={7} strokeLinecap="round" />
          {/* branches */}
          {geom.map((g) => <path key={g.i} d={g.branchD} fill="none" stroke="#46A897" strokeWidth={5} strokeLinecap="round" />)}
          {/* decorative leaves along the stem */}
          {geom.slice(0, 3).map((g) => (
            <ellipse key={`lf${g.i}`} cx={200 - g.side * 20} cy={g.podY + 30} rx={12} ry={6.5} fill="#46A897" transform={`rotate(${-g.side * 30} ${200 - g.side * 20} ${g.podY + 30})`} />
          ))}
          {/* pot */}
          <ellipse cx={200} cy={410} rx={72} ry={10} fill="#5c3a24" />
          <rect x={122} y={402} width={156} height={15} rx={4} fill="#174E64" />
          <path d="M130,417 L270,417 L254,476 L146,476 Z" fill="url(#gPotA)" />
        </svg>

        {/* "Your Progress" on the pot */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: "1.5%", textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", opacity: 0.92 }}>{ar ? "تقدّمك" : "Your Progress"}</div>
          <div style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.1 }}>{pct}%</div>
          <div style={{ margin: "5px auto 0", width: 110, height: 6, background: "rgba(255,255,255,.28)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "rgba(255,255,255,.95)", borderRadius: 999 }} />
          </div>
        </div>

        {/* summary pods */}
        {geom.map((g) => (
          <Pod key={g.b.g} branch={g.b} leftPct={(g.podX / 400) * 100} topPct={(g.podY / 480) * 100} delay={g.i * 100 + 100} onOpen={() => onOpen(g.b.g)} />
        ))}
      </div>

      <div style={{ textAlign: "center", fontSize: 11.5, color: MUTED, marginTop: 2 }}>{ar ? "انقر مساراً لفتح موادّه" : "Tap a path to open its branch of courses"}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", padding: "8px 12px 4px", fontSize: 11, color: MUTED }}>
        {[["#1E8378", ar ? "مكتملة" : "Completed"], ["#2C6E91", ar ? "قيد الدراسة" : "In progress"], ["#6BA6CF", ar ? "جاهزة" : "Ready"], ["#D8D1C2", ar ? "مقفلة" : "Locked"]].map(([c, l]) => (
          <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 999, background: c }} />{l}</span>
        ))}
      </div>
    </div>
  );
}

function Pod({ branch, leftPct, topPct, delay, onOpen }: { branch: Branch; leftPct: number; topPct: number; delay: number; onOpen: () => void }) {
  const accent = branch.locked ? "#D8D1C2" : "#1E8378";
  const countColor = branch.locked ? MUTED : "#156B61";
  return (
    <button
      onClick={onOpen}
      className="gPop"
      style={{ position: "absolute", left: `${leftPct}%`, top: `${topPct}%`, transform: "translate(-50%,-50%)", width: 132, background: SURFACE, border: `1.6px solid ${accent}`, borderRadius: "16px 16px 16px 5px", padding: "9px 10px", boxShadow: "0 5px 15px rgba(90,70,40,.14)", cursor: "pointer", textAlign: "left", animation: "gPop .5s cubic-bezier(.2,.8,.3,1.25) both", animationDelay: `${delay}ms` }}
    >
      {branch.anyProg && <span style={{ position: "absolute", top: -5, right: -5, width: 14, height: 14, borderRadius: 999, background: "#2C6E91", border: `2px solid ${SURFACE}` }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: "none", width: 22, height: 22, borderRadius: "50% 50% 50% 4px", background: branch.locked ? "#EFEDE6" : "#E4F0EA", display: "flex", alignItems: "center", justifyContent: "center" }} dangerouslySetInnerHTML={{ __html: branch.locked ? LOCK_ICON : LEAF_ICON }} />
        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.15, color: INK }}>{branch.label}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <div style={{ flex: 1, height: 6, background: TRACK, borderRadius: 999, overflow: "hidden" }}><div style={{ height: "100%", width: `${branch.pct}%`, background: accent, borderRadius: 999 }} /></div>
        <span style={{ fontSize: 11, fontWeight: 800, color: countColor }}>{branch.done}/{branch.total}</span>
      </div>
    </button>
  );
}

// ---- expanded branch: enlarged stem with leaf nodes + detail panel ---------

function GardenBranch({ branch, statuses, depth, name, ar, msg, codeOf, onBack, onToggle }: {
  branch: Branch; statuses: Map<string, CourseStatus>; depth: Map<string, number>; name: (c: Course) => string; ar: boolean; msg: (en: string, ar: string) => string; codeOf: (k: string) => string; onBack: () => void; onToggle: (code: string) => void;
}) {
  // Foundational courses first (lowest prereq depth) → they sit near the soil.
  const ordered = useMemo(
    () => [...branch.items].sort((a, b) => (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0) || a.code.localeCompare(b.code)),
    [branch.items, depth],
  );
  const N = ordered.length;
  const leaves = ordered.map((c, i) => {
    const frac = N > 1 ? i / (N - 1) : 0.5;
    const y = 250 - frac * 190; // bottom (250) → top (60)
    const side = i % 2 === 0 ? -1 : 1;
    const x = 200 + side * 86;
    return { c, i, x, y };
  });

  const prereqText = (c: Course) => (c.prerequisites.length
    ? `${msg("Needs", "تحتاج")} ${c.prerequisites.map((gr) => gr.map((k) => codeOf(k)).join(msg(" / ", " / "))).join(" + ")}`
    : msg("No prerequisites", "لا متطلّبات"));

  return (
    <div>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 2px 6px" }}>
        <button onClick={onBack} aria-label="Back" style={{ background: SURFACE, border: "none", width: 36, height: 36, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(90,70,40,.1)", flex: "none" }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">{ar ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}</svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 800, color: INK }}>{branch.label}</div>
          <div style={{ fontSize: 11.5, color: MUTED }}>{GARDEN_TAGS[branch.g][ar ? "ar" : "en"]}</div>
        </div>
        <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 12, fontWeight: 700, color: LAVENDER, cursor: "pointer", padding: 6 }}>{ar ? "الحديقة" : "Garden"}</button>
      </div>

      {/* enlarged branch */}
      <div style={{ position: "relative", width: "100%", maxWidth: 400, margin: "0 auto", aspectRatio: "400 / 300" }}>
        <svg viewBox="0 0 400 300" width="100%" height="100%" style={{ display: "block", position: "absolute", inset: 0 }}>
          <defs><linearGradient id="gStemB" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#1E8378" /><stop offset="1" stopColor="#8CD3C6" /></linearGradient></defs>
          <ellipse cx={200} cy={288} rx={52} ry={9} fill="#5c3a24" />
          <path d="M200,288 C200,215 200,150 200,42" fill="none" stroke="url(#gStemB)" strokeWidth={7} strokeLinecap="round" />
          {leaves.map((lf) => <line key={lf.i} x1={200} y1={lf.y} x2={lf.x} y2={lf.y} stroke="#5CB7A8" strokeWidth={3.5} strokeLinecap="round" />)}
        </svg>
        {leaves.map((lf) => (
          <LeafNode key={lf.c.id} course={lf.c} status={statuses.get(lf.c.id) ?? "locked"} leftPct={(lf.x / 400) * 100} topPct={(lf.y / 300) * 100} delay={lf.i * 95 + 250} onClick={() => onToggle(lf.c.code)} />
        ))}
      </div>

      {/* detail panel */}
      <div className="gFade" style={{ padding: "0 2px 8px", animation: "gFade .5s ease .12s both" }}>
        <div style={{ background: SURFACE, borderRadius: 22, boxShadow: "0 8px 24px rgba(90,70,40,.1)", padding: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: INK }}>{branch.label}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>{msg(`${branch.done} of ${branch.total} courses grown`, `${branch.done} من ${branch.total} مادة نمت`)}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1E8378" }}>{branch.pct}%</div>
          </div>
          <div style={{ height: 8, background: TRACK, borderRadius: 999, overflow: "hidden", marginTop: 11 }}><div style={{ height: "100%", width: `${branch.pct}%`, background: "#1E8378", borderRadius: 999 }} /></div>

          <div style={{ marginTop: 15, display: "flex", flexDirection: "column", gap: 8 }}>
            {ordered.map((c) => {
              const st = statuses.get(c.id) ?? "locked";
              const m = STATUS[st];
              const parts = c.code.split(" ");
              return (
                <button key={c.id} onClick={() => onToggle(c.code)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 11px", borderRadius: 14, background: CREAM, border: "none", cursor: "pointer", textAlign: "left", width: "100%" }}>
                  <span style={{ flex: "none", width: 34, height: 34, borderRadius: "50% 50% 50% 9px", background: m.bg, border: `2px solid ${m.ring}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 800, color: m.text }}>{parts[1] ?? parts[0]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{c.code}<span style={{ fontWeight: 500, color: MUTED }}> · {name(c)}</span></div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{prereqText(c)}</div>
                  </div>
                  <div style={{ textAlign: "right", flex: "none" }}>
                    <div style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999, background: m.bg, color: m.text, whiteSpace: "nowrap" }}>{ar ? m.ar : m.en}</div>
                    <div style={{ fontSize: 10.5, color: MUTED, marginTop: 4 }}>{c.credits} {ar ? "س" : "cr"}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeafNode({ course, status, leftPct, topPct, delay, onClick }: { course: Course; status: CourseStatus; leftPct: number; topPct: number; delay: number; onClick: () => void }) {
  const m = STATUS[status];
  const parts = course.code.split(" ");
  return (
    <button
      onClick={onClick}
      className="gLeaf"
      style={{ position: "absolute", left: `${leftPct}%`, top: `${topPct}%`, width: 72, height: 72, borderRadius: "50% 50% 50% 16px", border: `2px solid ${m.ring}`, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", transform: "translate(-50%,-50%) rotate(-8deg)", boxShadow: "0 5px 14px rgba(90,70,40,.15)", cursor: "pointer", padding: 0, animation: "gLeaf .5s cubic-bezier(.2,.8,.3,1.35) both", animationDelay: `${delay}ms` }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 999, background: SURFACE, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: "rotate(8deg)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.04)" }}>
        <span style={{ fontSize: 8.5, fontWeight: 700, color: MUTED, lineHeight: 1, letterSpacing: ".03em" }}>{parts[0]}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: INK, lineHeight: 1.15 }}>{parts[1] ?? ""}</span>
      </div>
      {status === "completed" && <span style={{ position: "absolute", top: -3, right: -3, width: 18, height: 18, borderRadius: 999, background: "#1E8378", color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${CREAM}` }}>✓</span>}
      {status === "locked" && <span style={{ position: "absolute", top: -3, right: -3, width: 18, height: 18, borderRadius: 999, background: "#D8D1C2", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${CREAM}` }} dangerouslySetInnerHTML={{ __html: `<svg width="9" height="9" viewBox="0 0 24 24" fill="#fff"><path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 016 0z"/></svg>` }} />}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Seed Bank — courses grouped by category
// ---------------------------------------------------------------------------

const GROUP_ORDER: RequirementGroup[] = ["gen_ed", "college_basic", "college_advanced", "major_required", "major_elective", "practical", "external"];

function SeedBankView({ courses, statuses, name, ar, onSelect }: { courses: Course[]; statuses: Map<string, CourseStatus>; name: (c: Course) => string; ar: boolean; onSelect: (k: string) => void }) {
  const groups = GROUP_ORDER.map((g) => ({ g, items: courses.filter((c) => c.requirementGroup === g) })).filter((x) => x.items.length > 0);
  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ g, items }) => (
        <div key={g}>
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-[15px] font-extrabold" style={{ color: INK }}>{ar ? GROUP_LABELS[g].ar : GROUP_LABELS[g].en}</span>
            <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: LAV_BG, color: LAVENDER }}>{items.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {items.map((c) => {
              const s = STATUS[statuses.get(c.id) ?? "locked"];
              return (
                <button key={c.id} onClick={() => onSelect(c.id)} className="rounded-2xl p-3 text-start transition active:scale-95" style={{ background: s.bg, border: `1.5px solid ${s.ring}44` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[20px] leading-none">{s.emoji}</span>
                    {statuses.get(c.id) === "completed" && <span className="text-[12px]">✓</span>}
                  </div>
                  <div className="mt-1.5 text-[12.5px] font-extrabold" style={{ color: s.text }}>{c.code}</div>
                  <div className="line-clamp-2 text-[11px] leading-tight" style={{ color: s.text, opacity: 0.8 }}>{name(c)}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Focus — what can I take next, and what's still resting
// ---------------------------------------------------------------------------

function FocusView({ courses, statuses, byKey, name, msg, onSelect }: {
  courses: Course[]; statuses: Map<string, CourseStatus>; byKey: Map<string, Course>; name: (c: Course) => string; msg: (en: string, ar: string) => string; onSelect: (k: string) => void;
}) {
  const real = courses.filter((c) => !c.external);
  const available = real.filter((c) => statuses.get(c.id) === "available");
  const inProgress = real.filter((c) => statuses.get(c.id) === "in_progress");
  const locked = real.filter((c) => statuses.get(c.id) === "locked");

  const need = (c: Course) => c.prerequisites
    .filter((grp) => !grp.some((k) => statuses.get(toCourseKey(k)) === "completed"))
    .map((grp) => grp.map((k) => byKey.get(toCourseKey(k))?.code ?? k).join(msg(" or ", " أو ")))
    .join(msg(" + ", " + "));

  return (
    <div className="flex flex-col gap-6">
      <FocusSection emoji="🌱" title={msg("Ready to plant", "جاهزة للزراعة")} subtitle={msg("You can take these right now", "يمكنك أخذها الآن")} count={available.length} empty={msg("Nothing new is ready yet — finish a growing course first. 🌼", "لا شيء جاهز بعد — أنهِ مادة قيد النمو أولاً. 🌼")}>
        {available.map((c) => <FocusRow key={c.id} course={c} status="available" name={name} onSelect={onSelect} />)}
      </FocusSection>

      {inProgress.length > 0 && (
        <FocusSection emoji="🌼" title={msg("Growing now", "تنمو الآن")} subtitle={msg("Courses you're taking", "مواد تدرسها حالياً")} count={inProgress.length} empty="">
          {inProgress.map((c) => <FocusRow key={c.id} course={c} status="in_progress" name={name} onSelect={onSelect} />)}
        </FocusSection>
      )}

      <FocusSection emoji="🌰" title={msg("Still resting", "نائمة بعد")} subtitle={msg("Locked until their prerequisites bloom", "مقفلة حتى تتفتّح متطلّباتها")} count={locked.length} empty={msg("Nothing locked — your whole garden is open! 🎉", "لا شيء مقفل — حديقتك كلها مفتوحة! 🎉")}>
        {locked.map((c) => <FocusRow key={c.id} course={c} status="locked" name={name} onSelect={onSelect} needText={need(c)} needLabel={msg("needs", "تحتاج")} />)}
      </FocusSection>
    </div>
  );
}

function FocusSection({ emoji, title, subtitle, count, empty, children }: { emoji: string; title: string; subtitle: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: SURFACE, boxShadow: "0 2px 10px rgba(90,70,40,.06)" }}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-[22px] leading-none">{emoji}</span>
        <div>
          <div className="text-[14.5px] font-extrabold leading-tight" style={{ color: INK }}>{title} <span style={{ color: MUTED }}>· {count}</span></div>
          <div className="text-[11.5px]" style={{ color: MUTED }}>{subtitle}</div>
        </div>
      </div>
      {count === 0 && empty ? <div className="text-[13px]" style={{ color: MUTED }}>{empty}</div> : <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );
}

function FocusRow({ course, status, name, onSelect, needText, needLabel }: { course: Course; status: CourseStatus; name: (c: Course) => string; onSelect: (k: string) => void; needText?: string; needLabel?: string }) {
  const s = STATUS[status];
  return (
    <button onClick={() => onSelect(course.id)} className="flex items-center gap-3 rounded-xl p-2.5 text-start transition active:scale-[0.98]" style={{ background: s.bg }}>
      <span className="text-[20px] leading-none">{s.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-extrabold" style={{ color: s.text }}>{course.code} <span className="font-medium" style={{ opacity: 0.85 }}>· {name(course)}</span></div>
        {needText ? <div className="truncate text-[11px]" style={{ color: s.text, opacity: 0.8 }}>{needLabel}: {needText}</div> : null}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Progress — ring + credits
// ---------------------------------------------------------------------------

function ProgressView({ stats, msg, name, onSelect }: {
  stats: ReturnType<typeof computeGardenStats>; msg: (en: string, ar: string) => string; name: (c: Course) => string; onSelect: (k: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center rounded-2xl p-6" style={{ background: SURFACE, boxShadow: "0 2px 10px rgba(90,70,40,.06)" }}>
        <ProgressRing pct={stats.progressPct} />
        <div className="mt-3 text-[13px]" style={{ color: MUTED }}>{msg("of your degree has bloomed", "من شهادتك قد تفتّح")}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatTile emoji="🌸" label={msg("Courses done", "مواد أُنجزت")} value={`${stats.completedCount}/${stats.totalCount}`} />
        <StatTile emoji="⭐" label={msg("Credits earned", "ساعات مكتسبة")} value={`${stats.earnedCredits}/${stats.totalCredits}`} />
        <StatTile emoji="🎓" label={msg("Est. graduation", "التخرّج المتوقّع")} value={stats.gradTerm} />
        <StatTile emoji="🌱" label={msg("Next to plant", "التالية للزراعة")} value={stats.nextCourse?.code ?? "—"} onClick={stats.nextCourse ? () => onSelect(stats.nextCourse!.id) : undefined} sub={stats.nextCourse ? name(stats.nextCourse) : undefined} />
      </div>
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const size = 140, stroke = 14, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TRACK} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E8378" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} style={{ transition: "stroke-dashoffset .5s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-extrabold" style={{ color: INK }}>{pct}%</span>
      </div>
    </div>
  );
}

function StatTile({ emoji, label, value, sub, onClick }: { emoji: string; label: string; value: string; sub?: string; onClick?: () => void }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className="rounded-2xl p-3.5 text-start" style={{ background: SURFACE, boxShadow: "0 2px 10px rgba(90,70,40,.06)", width: "100%" }}>
      <div className="text-[19px] leading-none">{emoji}</div>
      <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>{label}</div>
      <div className="text-[16px] font-extrabold leading-tight" style={{ color: INK }}>{value}</div>
      {sub ? <div className="truncate text-[11px]" style={{ color: MUTED }}>{sub}</div> : null}
    </Comp>
  );
}

// ---------------------------------------------------------------------------
// Side dashboard
// ---------------------------------------------------------------------------

function Dashboard({ stats, msg, name, onPickNext }: {
  stats: ReturnType<typeof computeGardenStats>; msg: (en: string, ar: string) => string; name: (c: Course) => string; onPickNext: (k: string) => void;
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: SURFACE, boxShadow: "0 2px 12px rgba(90,70,40,.08)" }}>
      <div className="flex items-center gap-3">
        <ProgressRingSmall pct={stats.progressPct} />
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>{msg("Overall progress", "التقدّم العام")}</div>
          <div className="text-[20px] font-extrabold" style={{ color: INK }}>{stats.progressPct}%</div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        <MiniStat emoji="🌸" label={msg("Courses completed", "المواد المكتملة")} value={`${stats.completedCount} / ${stats.totalCount}`} />
        <MiniStat emoji="⭐" label={msg("Credits earned", "الساعات المكتسبة")} value={`${stats.earnedCredits} / ${stats.totalCredits}`} />
        <MiniStat emoji="🎓" label={msg("Est. graduation", "التخرّج المتوقّع")} value={stats.gradTerm} />
      </div>

      {stats.nextCourse && (
        <button onClick={() => onPickNext(stats.nextCourse!.id)} className="mt-4 w-full rounded-2xl p-3 text-start transition active:scale-[0.98]" style={{ background: LAV_BG }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: LAVENDER }}>🌱 {msg("Best next course", "أفضل مادة تالية")}</div>
          <div className="text-[15px] font-extrabold" style={{ color: INK }}>{stats.nextCourse.code}</div>
          <div className="truncate text-[12px]" style={{ color: MUTED }}>{name(stats.nextCourse)}</div>
        </button>
      )}
    </div>
  );
}

function MiniStat({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[16px]" style={{ background: CREAM }}>{emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px]" style={{ color: MUTED }}>{label}</div>
        <div className="text-[14px] font-extrabold leading-tight" style={{ color: INK }}>{value}</div>
      </div>
    </div>
  );
}

function ProgressRingSmall({ pct }: { pct: number }) {
  const size = 54, stroke = 7, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TRACK} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E8378" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Course card (bottom sheet / dialog)
// ---------------------------------------------------------------------------

function CourseCard({ course, statuses, byKey, unlocks, completedKeys, name, ar, msg, onSelect, onClose, onToggle }: {
  course: Course; statuses: Map<string, CourseStatus>; byKey: Map<string, Course>; unlocks: string[]; completedKeys: Set<string>; name: (c: Course) => string; ar: boolean; msg: (en: string, ar: string) => string; onSelect: (k: string) => void; onClose: () => void; onToggle: () => void;
}) {
  const status = statuses.get(course.id) ?? "locked";
  const s = STATUS[status];
  const done = status === "completed";

  return (
    <div onClick={onClose} className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center" style={{ background: "rgba(70,55,35,.4)" }}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl" style={{ background: CREAM, paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full sm:hidden" style={{ background: "#E0D6C2" }} />

        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[26px]" style={{ background: s.bg, border: `1.5px solid ${s.ring}55` }}>{s.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[19px] font-extrabold" style={{ color: INK }}>{course.code}</div>
            <div className="text-[13.5px]" style={{ color: MUTED }}>{name(course)}</div>
          </div>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-[16px]" style={{ background: SURFACE, color: MUTED }}>✕</button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: s.chip, color: s.text }}>{s.emoji} {ar ? s.ar : s.en}</span>
          <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: SURFACE, color: MUTED }}>{course.credits} {msg("credits", "ساعة")}</span>
          {course.standing && <span className="rounded-full px-3 py-1 text-[12px] font-semibold" style={{ background: LAV_BG, color: LAVENDER }}>{course.standing === "senior" ? msg("Senior standing", "سنة متقدّمة") : msg("Junior standing", "سنة متوسطة")}</span>}
        </div>

        {/* prerequisites */}
        <div className="mt-4">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>🌱 {msg("Needs first", "تحتاج أولاً")}</div>
          {course.prerequisites.length === 0 ? (
            <div className="text-[13px]" style={{ color: MUTED }}>{msg("Nothing — a great seed to start with.", "لا شيء — بذرة رائعة للبدء بها.")}</div>
          ) : (
            <div className="flex flex-col gap-2">
              {course.prerequisites.map((group, gi) => (
                <div key={gi}>
                  {gi > 0 && <div className="my-1 text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>{msg("and", "و")}</div>}
                  <div className="flex flex-wrap gap-1.5">
                    {group.map((k, oi) => {
                      const kk = toCourseKey(k);
                      const dep = byKey.get(kk);
                      const dStat = statuses.get(kk) ?? "locked";
                      const ds = STATUS[dStat];
                      return (
                        <span key={kk} className="flex items-center gap-1">
                          {oi > 0 && <span className="text-[10px] font-bold uppercase" style={{ color: MUTED }}>{msg("or", "أو")}</span>}
                          <button onClick={() => dep && onSelect(kk)} className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12.5px] font-bold" style={{ background: ds.bg, color: ds.text }}>
                            <span>{dStat === "completed" ? "✓" : ds.emoji}</span>{dep?.code ?? k}
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* unlocks */}
        <div className="mt-4">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>🌸 {msg("Unlocks next", "يفتح التالي")}</div>
          {unlocks.length === 0 ? (
            <div className="text-[13px]" style={{ color: MUTED }}>{msg("This is a final bloom — it opens nothing further. 🎓", "هذه زهرة أخيرة — لا تفتح شيئاً بعدها. 🎓")}</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {unlocks.map((k) => {
                const dep = byKey.get(k);
                if (!dep) return null;
                const ds = STATUS[statuses.get(k) ?? "locked"];
                const newly = statuses.get(k) === "locked" && dep.prerequisites.every((g) => g.some((x) => x === course.id || completedKeys.has(toCourseKey(x))));
                return (
                  <button key={k} onClick={() => onSelect(k)} className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12.5px] font-bold" style={{ background: ds.bg, color: ds.text }}>
                    <span>{ds.emoji}</span>{dep.code}
                    {newly && <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black text-white" style={{ background: "#1E8378" }}>NEW</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={onToggle} className="mt-5 w-full rounded-2xl py-3 text-[14px] font-extrabold text-white transition active:scale-[0.98]" style={{ background: done ? "#D8D1C2" : "#1E8378" }}>
          {done ? msg("↩ Mark as not done", "↩ إلغاء الإكمال") : msg("🌸 Mark as completed", "🌸 تمّ إكمالها")}
        </button>
      </div>
    </div>
  );
}
