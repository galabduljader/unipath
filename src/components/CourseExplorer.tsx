"use client";

// Dead-simple, focused course explorer. The student picks ONE course and sees only
// what's relevant to it: its prerequisites (what to take first) and what it unlocks
// (what opens up after). Everything else is hidden. Every related course is itself
// clickable, so the student walks the chain one clean step at a time.

import { useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/data";
import { Icon } from "@/components/ui";
import type { Course } from "@/lib/schema/majorSheet";
import { toCourseKey } from "@/lib/schema/majorSheet";
import { computeStatuses, type CourseEdge, type CourseStatus } from "@/lib/majorSheet/graph";

const STATUS: Record<CourseStatus, { icon: string; color: string; bg: string; en: string; ar: string }> = {
  completed: { icon: "check_circle", color: "#1E8378", bg: "#E6F2EF", en: "Completed", ar: "مكتملة" },
  in_progress: { icon: "pending", color: "#2C6E91", bg: "#EAF1F7", en: "In progress", ar: "قيد الدراسة" },
  available: { icon: "bolt", color: "#1E8378", bg: "#E1F5EE", en: "Available now", ar: "متاحة الآن" },
  locked: { icon: "lock", color: "#B5762E", bg: "#F6ECD7", en: "Locked", ar: "مقفلة" },
};

export function CourseExplorer({
  courses,
  edges,
  onViewFullMap,
}: {
  courses: Course[];
  edges: CourseEdge[];
  onViewFullMap?: () => void;
}) {
  const { lang } = useI18n();
  const { completed, toggleCompleted } = useData();
  const ar = lang === "ar";
  const msg = (en: string, arText: string) => (ar ? arText : en);

  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  const completedKeys = useMemo(() => new Set([...completed].map(toCourseKey)), [completed]);
  const statuses = useMemo(() => computeStatuses(courses, { completed: completedKeys }), [courses, completedKeys]);
  const byKey = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  // Direct dependents (reverse of prerequisite edges): what each course unlocks.
  const unlocksMap = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const e of edges) {
      if (e.kind !== "prerequisite") continue;
      if (!m.has(e.sourceKey)) m.set(e.sourceKey, []);
      if (!m.get(e.sourceKey)!.includes(e.targetKey)) m.get(e.sourceKey)!.push(e.targetKey);
    }
    return m;
  }, [edges]);

  const name = (c: Course) => (ar && c.nameAr ? c.nameAr : c.name);

  function focus(key: string) {
    setSelected(key);
    setQuery("");
    // bring the focused course into view (helps when clicking a deep chip)
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const course = selected ? byKey.get(selected) ?? null : null;

  return (
    <div ref={topRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {course ? (
        <FocusView
          course={course}
          statuses={statuses}
          completedKeys={completedKeys}
          byKey={byKey}
          unlocksMap={unlocksMap}
          name={name}
          ar={ar}
          msg={msg}
          onPick={focus}
          onBack={() => setSelected(null)}
          onToggleCompleted={() => toggleCompleted(course.code)}
        />
      ) : (
        <Picker
          courses={courses}
          statuses={statuses}
          query={query}
          setQuery={setQuery}
          name={name}
          ar={ar}
          msg={msg}
          onPick={focus}
          onViewFullMap={onViewFullMap}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state: search + pick a course
// ---------------------------------------------------------------------------

function Picker({
  courses,
  statuses,
  query,
  setQuery,
  name,
  ar,
  msg,
  onPick,
  onViewFullMap,
}: {
  courses: Course[];
  statuses: Map<string, CourseStatus>;
  query: string;
  setQuery: (v: string) => void;
  name: (c: Course) => string;
  ar: boolean;
  msg: (en: string, ar: string) => string;
  onPick: (key: string) => void;
  onViewFullMap?: () => void;
}) {
  const q = query.trim().toLowerCase();
  const list = useMemo(() => {
    const filtered = courses.filter((c) => !c.external).filter((c) => !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (c.nameAr ?? "").includes(query));
    return filtered.sort((a, b) => a.code.localeCompare(b.code)).slice(0, 60);
  }, [courses, q, query]);

  return (
    <div style={cardStyle}>
      <div className="serif" style={{ fontSize: 21, fontWeight: 700, color: "var(--ink-strong)" }}>
        {msg("Explore your courses", "استكشف موادّك")}
      </div>
      <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 4, marginBottom: 16 }}>
        {msg("Pick a course to see what it needs and what it unlocks.", "اختر مادة لترى ما تحتاجه وما تفتحه.")}
      </div>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <span style={{ position: "absolute", insetInlineStart: 12, top: "50%", transform: "translateY(-50%)", color: "var(--faint)", pointerEvents: "none" }}><Icon name="search" size={19} /></span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={msg("Search a course code or name…", "ابحث برمز المادة أو اسمها…")}
          style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px 12px 40px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-2)", fontSize: 14, color: "var(--text)", outline: "none" }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 460, overflowY: "auto", paddingInlineEnd: 2 }}>
        {list.map((c) => (
          <CourseRow key={c.id} course={c} status={statuses.get(c.id) ?? "locked"} name={name} ar={ar} onClick={() => onPick(c.id)} />
        ))}
        {list.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--faint)", fontSize: 13, padding: "24px 0" }}>{msg("No courses match that search.", "لا توجد مواد مطابقة.")}</div>
        )}
      </div>

      {onViewFullMap && (
        <button onClick={onViewFullMap} style={{ marginTop: 14, width: "100%", background: "var(--surface-2)", color: "var(--muted)", border: "1px solid var(--border)", borderRadius: 11, padding: "11px", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer" }}>
          <Icon name="account_tree" size={17} />{msg("See the full map instead", "عرض الخريطة الكاملة بدلاً من ذلك")}
        </button>
      )}
    </div>
  );
}

// A compact selectable row for the picker list.
function CourseRow({ course, status, name, ar, onClick }: { course: Course; status: CourseStatus; name: (c: Course) => string; ar: boolean; onClick: () => void }) {
  const s = STATUS[status];
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 11, background: "var(--surface)", cursor: "pointer", textAlign: "start", width: "100%" }}>
      <Icon name={s.icon} size={19} color={s.color} />
      <span style={{ fontWeight: 800, fontSize: 13.5, color: "var(--ink-strong)", minWidth: 74 }}>{course.code}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name(course)}</span>
      <Icon name={ar ? "chevron_left" : "chevron_right"} size={18} color="var(--faint)" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Focus view: prerequisites → this course → unlocks
// ---------------------------------------------------------------------------

function FocusView({
  course,
  statuses,
  completedKeys,
  byKey,
  unlocksMap,
  name,
  ar,
  msg,
  onPick,
  onBack,
  onToggleCompleted,
}: {
  course: Course;
  statuses: Map<string, CourseStatus>;
  completedKeys: Set<string>;
  byKey: Map<string, Course>;
  unlocksMap: Map<string, string[]>;
  name: (c: Course) => string;
  ar: boolean;
  msg: (en: string, ar: string) => string;
  onPick: (key: string) => void;
  onBack: () => void;
  onToggleCompleted: () => void;
}) {
  const status = statuses.get(course.id) ?? "locked";
  const s = STATUS[status];

  // Groups the student hasn't satisfied yet — for the precise, AND/OR-correct reason.
  const unmet = course.prerequisites.filter((group) => !group.some((k) => completedKeys.has(toCourseKey(k))));

  const unlockKeys = unlocksMap.get(course.id) ?? [];
  const coreqKeys = [...new Set(course.corequisites.flat().map(toCourseKey))];

  // "Newly available" = this locked dependent would flip to available once THIS
  // course is completed (every other prereq group already satisfied).
  const wouldUnlock = (depKey: string) => {
    if ((statuses.get(depKey) ?? "locked") !== "locked") return false;
    const dep = byKey.get(depKey);
    if (!dep) return false;
    const withThis = new Set(completedKeys);
    withThis.add(course.id);
    return dep.prerequisites.every((group) => group.some((k) => withThis.has(toCourseKey(k))));
  };

  const lockedReason = () => {
    const parts = unmet.map((group) => {
      const opts = group.map((k) => byKey.get(toCourseKey(k))?.code ?? k);
      return group.length > 1 ? msg(`one of: ${opts.join(", ")}`, `إحدى: ${opts.join("، ")}`) : opts[0];
    });
    return parts.join(msg(" and ", " و "));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* top bar */}
      <button onClick={onBack} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#2C6E91", fontWeight: 700, fontSize: 13.5, cursor: "pointer", padding: "2px 0" }}>
        <Icon name={ar ? "arrow_forward" : "arrow_back"} size={18} />{msg("All courses", "كل المواد")}
      </button>

      {/* Prerequisites (take these first) */}
      <Section
        icon="south"
        title={msg("Take these first", "خذ هذه أولاً")}
        subtitle={msg("Prerequisites", "المتطلّبات السابقة")}
        empty={course.prerequisites.length === 0}
        emptyText={msg("No prerequisites — a great place to start. 🌱", "لا متطلّبات سابقة — بداية رائعة. 🌱")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {course.prerequisites.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <Divider label={msg("and", "و")} />}
              {group.length > 1 ? (
                <div style={{ border: "1px dashed var(--border)", borderRadius: 12, padding: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6, paddingInlineStart: 2 }}>{msg("Take any one of these", "خذ أياً من هذه")}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {group.map((k, oi) => (
                      <RelatedCard key={oi} k={toCourseKey(k)} byKey={byKey} statuses={statuses} name={name} ar={ar} onPick={onPick} orTag={oi > 0 ? msg("or", "أو") : undefined} />
                    ))}
                  </div>
                </div>
              ) : (
                <RelatedCard k={toCourseKey(group[0])} byKey={byKey} statuses={statuses} name={name} ar={ar} onPick={onPick} />
              )}
            </div>
          ))}
        </div>
      </Section>

      <FlowArrow />

      {/* The selected course */}
      <div style={{ ...cardStyle, border: `2px solid ${s.color}`, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink-strong)" }}>{course.code}</div>
            <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 2 }}>{name(course)}</div>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, padding: "6px 11px", borderRadius: 20, background: s.bg, color: s.color, flexShrink: 0 }}>
            <Icon name={s.icon} size={15} />{ar ? s.ar : s.en}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <Pill>{course.credits} {msg("credits", "ساعة")}</Pill>
          {course.standing && <Pill amber>{course.standing === "senior" ? msg("Senior standing", "سنة متقدّمة") : msg("Junior standing", "سنة متوسطة")}</Pill>}
          {course.needsReview && <Pill red>{msg("Needs review", "بحاجة لمراجعة")}</Pill>}
        </div>

        {status === "locked" && unmet.length > 0 && (
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start", background: "#F6ECD7", border: "1px solid #E8D6AE", borderRadius: 11, padding: "10px 12px", marginTop: 12, fontSize: 12.5, color: "#7a5a2c" }}>
            <Icon name="lock" size={16} color="#B5762E" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{msg("You still need: ", "لا يزال عليك: ")}<strong>{lockedReason()}</strong></span>
          </div>
        )}

        {coreqKeys.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 7 }}>{msg("Take alongside (co-requisite)", "خذها بالتزامن")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {coreqKeys.map((k) => (
                <RelatedCard key={k} k={k} byKey={byKey} statuses={statuses} name={name} ar={ar} onPick={onPick} />
              ))}
            </div>
          </div>
        )}

        <button onClick={onToggleCompleted} style={{ width: "100%", marginTop: 16, padding: 12, borderRadius: 12, border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: status === "completed" ? "var(--surface-2)" : s.color, color: status === "completed" ? "var(--muted)" : "#fff" }}>
          <Icon name={status === "completed" ? "replay" : "check_circle"} size={18} />
          {status === "completed" ? msg("Mark as not done", "إلغاء الإكمال") : msg("Mark as completed", "تمّ إكمالها")}
        </button>
      </div>

      <FlowArrow />

      {/* Unlocks (what opens up after) */}
      <Section
        icon="lock_open"
        title={msg("This opens up", "يفتح لك")}
        subtitle={msg("Unlocks", "يفتح")}
        empty={unlockKeys.length === 0}
        emptyText={msg("This is a final course — it isn't required by anything else. 🎓", "هذه مادة نهائية — لا تُشترط لأي مادة أخرى. 🎓")}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {unlockKeys
            .map((k) => byKey.get(k))
            .filter((c): c is Course => Boolean(c))
            .sort((a, b) => a.code.localeCompare(b.code))
            .map((dep) => (
              <RelatedCard key={dep.id} k={dep.id} byKey={byKey} statuses={statuses} name={name} ar={ar} onPick={onPick} newlyAvailable={wouldUnlock(dep.id)} newlyLabel={msg("newly available", "أصبحت متاحة")} />
            ))}
        </div>
      </Section>
    </div>
  );
}

// A related course as a clickable card, showing its own status so the student sees
// which branch to pursue at a glance.
function RelatedCard({
  k,
  byKey,
  statuses,
  name,
  ar,
  onPick,
  orTag,
  newlyAvailable,
  newlyLabel,
}: {
  k: string;
  byKey: Map<string, Course>;
  statuses: Map<string, CourseStatus>;
  name: (c: Course) => string;
  ar: boolean;
  onPick: (key: string) => void;
  orTag?: string;
  newlyAvailable?: boolean;
  newlyLabel?: string;
}) {
  const c = byKey.get(k);
  if (!c) return null;
  const s = STATUS[statuses.get(k) ?? "locked"];
  return (
    <button onClick={() => onPick(k)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 11, background: "var(--surface)", cursor: "pointer", textAlign: "start", width: "100%", position: "relative" }}>
      {orTag && <span style={{ fontSize: 10, fontWeight: 800, color: "var(--faint)", textTransform: "uppercase" }}>{orTag}</span>}
      <span style={{ width: 26, height: 26, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={s.icon} size={16} color={s.color} /></span>
      <span style={{ fontWeight: 800, fontSize: 13.5, color: "var(--ink-strong)", minWidth: 70 }}>{c.code}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name(c)}</span>
      {newlyAvailable && <span style={{ fontSize: 9.5, fontWeight: 800, color: "#1E8378", background: "#E1F5EE", padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}>{newlyLabel}</span>}
      <Icon name={ar ? "chevron_left" : "chevron_right"} size={17} color="var(--faint)" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// small building blocks
// ---------------------------------------------------------------------------

const cardStyle: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 22 };

function Section({ icon, title, subtitle, empty, emptyText, children }: { icon: string; title: string; subtitle: string; empty: boolean; emptyText: string; children: React.ReactNode }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={icon} size={18} color="#2C6E91" /></span>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink-strong)", lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: 11, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 600 }}>{subtitle}</div>
        </div>
      </div>
      {empty ? <div style={{ fontSize: 13, color: "var(--muted)", padding: "4px 2px" }}>{emptyText}</div> : children}
    </div>
  );
}

function FlowArrow() {
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "-4px 0" }}>
      <Icon name="arrow_downward" size={20} color="var(--faint)" />
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--faint)", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function Pill({ children, amber, red }: { children: React.ReactNode; amber?: boolean; red?: boolean }) {
  const c = amber ? { bg: "#F6ECD7", fg: "#7a5a2c" } : red ? { bg: "#FBECEC", fg: "#B5564E" } : { bg: "var(--surface-2)", fg: "var(--muted)" };
  return <span style={{ fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 8, background: c.bg, color: c.fg }}>{children}</span>;
}
