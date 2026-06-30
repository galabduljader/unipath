"use client";

import { useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useData, type EventType, type CalEvent } from "@/lib/data";
import { Icon, useIsMobile } from "@/components/ui";
import { toArabicDigits } from "@/lib/catalog";

const TYPE_META: Record<EventType, { color: string; bg: string; en: string; ar: string; icon: string }> = {
  exam: { color: "#C2566A", bg: "#FBECEF", en: "Exam", ar: "اختبار", icon: "history_edu" },
  assignment: { color: "#2C6E91", bg: "#EAF1F7", en: "Assignment", ar: "واجب", icon: "assignment" },
  quiz: { color: "#3E7CB1", bg: "#EAF1F7", en: "Quiz", ar: "كويز", icon: "quiz" },
  project: { color: "#1E8378", bg: "#E6F2EF", en: "Project", ar: "مشروع", icon: "folder_special" },
  class: { color: "#B5762E", bg: "#F6ECD7", en: "Class", ar: "محاضرة", icon: "school" },
  other: { color: "#6E7C86", bg: "var(--surface-2)", en: "Other", ar: "آخر", icon: "event" },
};

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_AR = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export default function CalendarPage() {
  const { lang } = useI18n();
  const { events, addEvent, delEvent } = useData();
  const isMobile = useIsMobile();
  const ar = lang === "ar";

  const today = new Date();
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState(todayIso);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("assignment");
  const [time, setTime] = useState("");
  const [course, setCourse] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const byDate = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) {
      if (!m.has(e.event_date)) m.set(e.event_date, []);
      m.get(e.event_date)!.push(e);
    }
    return m;
  }, [events]);

  const monthName = (ar ? MONTHS_AR : MONTHS_EN)[cursor.m];
  const yearLabel = ar ? toArabicDigits(cursor.y) : cursor.y;
  const dayNum = (n: number) => (ar ? toArabicDigits(n) : n);

  const firstDow = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  function shift(delta: number) {
    setCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  }
  function goToday() { setCursor({ y: today.getFullYear(), m: today.getMonth() }); setSelected(todayIso); }

  async function add() {
    const ti = title.trim();
    if (!ti) return;
    await addEvent({ title: ti, type, event_date: selected, event_time: time, course });
    setTitle(""); setTime(""); setCourse("");
    titleRef.current?.focus();
  }

  const dateLabel = (isoStr: string) => {
    const d = new Date(isoStr + "T00:00:00");
    return `${(ar ? DOW_AR : DOW_EN)[d.getDay()]} · ${dayNum(d.getDate())} ${(ar ? MONTHS_AR : MONTHS_EN)[d.getMonth()]}`;
  };

  const selEvents = (byDate.get(selected) ?? []).sort((a, b) => (a.event_time || "").localeCompare(b.event_time || ""));
  const upcoming = useMemo(
    () => [...events].filter((e) => e.event_date >= todayIso).sort((a, b) => a.event_date.localeCompare(b.event_date) || (a.event_time || "").localeCompare(b.event_time || "")).slice(0, 5),
    [events, todayIso]
  );

  const inputStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, outline: "none", color: "var(--text)", background: "var(--surface-2)" };
  const cellH = isMobile ? 58 : 88;

  // ===== the month calendar grid =====
  const grid = (
    <div style={{ flex: 2, minWidth: isMobile ? "100%" : 360, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: isMobile ? 12 : 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div className="serif" style={{ fontSize: 21, fontWeight: 600, color: "var(--ink-strong)" }}>{monthName} {yearLabel}</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={goToday} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 9, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>{ar ? "اليوم" : "Today"}</button>
          <button onClick={() => shift(-1)} aria-label="Previous month" style={{ width: 34, height: 34, borderRadius: 9, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}><Icon name={ar ? "chevron_right" : "chevron_left"} size={20} /></button>
          <button onClick={() => shift(1)} aria-label="Next month" style={{ width: 34, height: 34, borderRadius: 9, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}><Icon name={ar ? "chevron_left" : "chevron_right"} size={20} /></button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: isMobile ? 4 : 6 }}>
        {(ar ? DOW_AR : DOW_EN).map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: isMobile ? 10 : 11, fontWeight: 700, color: "var(--faint)", padding: "2px 0", textTransform: "uppercase", letterSpacing: ".03em" }}>{isMobile ? d.slice(0, 3) : d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const dIso = iso(cursor.y, cursor.m, d);
          const evs = byDate.get(dIso) ?? [];
          const isToday = dIso === todayIso;
          const isSel = dIso === selected;
          return (
            <button key={i} onClick={() => setSelected(dIso)} style={{ minHeight: cellH, borderRadius: 10, border: `${isSel ? 2 : 1}px solid ${isSel ? "#1E8378" : "var(--border)"}`, background: isSel ? "#E6F2EF" : "var(--surface)", padding: isMobile ? 4 : 6, display: "flex", flexDirection: "column", gap: 3, alignItems: "stretch", textAlign: "start", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: isMobile ? "center" : "flex-start" }}>
                <span style={{ fontSize: 12, fontWeight: 700, width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isToday ? "#102A40" : "transparent", color: isToday ? "#fff" : isSel ? "#156B61" : "var(--muted)" }}>{dayNum(d)}</span>
              </div>
              {evs.length > 0 && (isMobile ? (
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                  {evs.slice(0, 4).map((e) => <span key={e.id} style={{ width: 5, height: 5, borderRadius: "50%", background: TYPE_META[e.type].color }} />)}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
                  {evs.slice(0, 2).map((e) => (
                    <div key={e.id} title={e.title} style={{ fontSize: 9.5, fontWeight: 600, color: TYPE_META[e.type].color, background: TYPE_META[e.type].bg, borderRadius: 4, padding: "1px 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                  ))}
                  {evs.length > 2 && <div style={{ fontSize: 9, color: "var(--faint)" }}>+{evs.length - 2}</div>}
                </div>
              ))}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
        {(Object.keys(TYPE_META) as EventType[]).map((k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--muted)" }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: TYPE_META[k].color }} />{ar ? TYPE_META[k].ar : TYPE_META[k].en}
          </div>
        ))}
      </div>
    </div>
  );

  // ===== side panel: selected day + quick add + upcoming =====
  const panel = (
    <div style={{ flex: 1, minWidth: isMobile ? "100%" : 280, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 16 }}>
        <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: "var(--ink-strong)", marginBottom: 10 }}>{dateLabel(selected)}</div>
        {selEvents.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--faint)", padding: "6px 0 10px" }}>{ar ? "لا أحداث في هذا اليوم." : "No events on this day."}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {selEvents.map((e) => <EventRow key={e.id} e={e} ar={ar} onDel={() => delEvent(e.id)} />)}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px dashed var(--border)", paddingTop: 12 }}>
          <input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={ar ? "أضف حدثاً لهذا اليوم…" : "Add an event to this day…"} style={inputStyle} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={type} onChange={(e) => setType(e.target.value as EventType)} style={{ ...inputStyle, flex: 1, minWidth: 110, cursor: "pointer" }}>
              {(Object.keys(TYPE_META) as EventType[]).map((k) => <option key={k} value={k}>{ar ? TYPE_META[k].ar : TYPE_META[k].en}</option>)}
            </select>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...inputStyle, width: 116 }} />
          </div>
          <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder={ar ? "المادة (اختياري)" : "Course (optional)"} style={inputStyle} />
          <button onClick={add} style={{ background: "#102A40", color: "#fff", border: "none", borderRadius: 10, padding: 11, fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon name="add" size={18} />{ar ? "أضف الحدث" : "Add event"}</button>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: 16 }}>
        <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: "var(--ink-strong)", marginBottom: 12 }}>{ar ? "القادمة" : "Upcoming"}</div>
        {upcoming.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--faint)", padding: "6px 0" }}>{ar ? "لا أحداث قادمة." : "Nothing coming up."}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map((e) => <EventRow key={e.id} e={e} ar={ar} dateLabel={dateLabel(e.event_date)} onDel={() => delEvent(e.id)} />)}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }} className="fade-up">
      {grid}
      {panel}
    </div>
  );
}

function EventRow({ e, ar, dateLabel, onDel }: { e: CalEvent; ar: boolean; dateLabel?: string; onDel: () => void }) {
  const meta = TYPE_META[e.type];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", border: "1px solid var(--border)", borderRadius: 11, background: "var(--surface-2)" }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: meta.bg, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={meta.icon} size={17} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
        <div style={{ fontSize: 11.5, color: "var(--faint)", display: "flex", gap: 7, flexWrap: "wrap" }}>
          <span style={{ color: meta.color, fontWeight: 600 }}>{ar ? meta.ar : meta.en}</span>
          {dateLabel && <span>· {dateLabel}</span>}
          {e.event_time && <span>· {e.event_time}</span>}
          {e.course && <span>· {e.course}</span>}
        </div>
      </div>
      <button onClick={onDel} aria-label="Delete" style={{ background: "none", border: "none", padding: 4, display: "flex", color: "#c2b9ac", flexShrink: 0 }}><Icon name="close" size={17} /></button>
    </div>
  );
}
