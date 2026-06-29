"use client";

import { useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useData, type EventType, type CalEvent } from "@/lib/data";
import { Icon, useIsMobile } from "@/components/ui";
import { toArabicDigits } from "@/lib/catalog";

const TYPE_META: Record<EventType, { color: string; bg: string; en: string; ar: string; icon: string }> = {
  exam: { color: "#C2566A", bg: "#FBECEF", en: "Exam", ar: "اختبار", icon: "history_edu" },
  assignment: { color: "#2C6E91", bg: "#EAF1F7", en: "Assignment", ar: "واجب", icon: "assignment" },
  quiz: { color: "#7A5AA8", bg: "#EEE7F4", en: "Quiz", ar: "كويز", icon: "quiz" },
  project: { color: "#1E8378", bg: "#E6F2EF", en: "Project", ar: "مشروع", icon: "folder_special" },
  class: { color: "#B5762E", bg: "#F6ECD7", en: "Class", ar: "محاضرة", icon: "school" },
  other: { color: "#6E7C86", bg: "#F4EEE3", en: "Other", ar: "آخر", icon: "event" },
};

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_AR = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export default function CalendarPage() {
  const { t, lang } = useI18n();
  const { events, addEvent, delEvent } = useData();
  const isMobile = useIsMobile();

  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState(iso(today.getFullYear(), today.getMonth(), today.getDate()));

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

  const ar = lang === "ar";
  const monthName = (ar ? MONTHS_AR : MONTHS_EN)[cursor.m];
  const yearLabel = ar ? toArabicDigits(cursor.y) : cursor.y;
  const dayNum = (n: number) => (ar ? toArabicDigits(n) : n);

  const firstDow = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());

  function shift(delta: number) {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }
  function goToday() {
    setCursor({ y: today.getFullYear(), m: today.getMonth() });
    setSelected(todayIso);
  }

  async function add() {
    const ti = title.trim();
    if (!ti) return;
    await addEvent({ title: ti, type, event_date: selected, event_time: time, course });
    setTitle(""); setTime(""); setCourse("");
    titleRef.current?.focus();
  }

  const selEvents = (byDate.get(selected) ?? []).sort((a, b) => (a.event_time || "").localeCompare(b.event_time || ""));
  const upcoming = [...events]
    .filter((e) => e.event_date >= todayIso)
    .sort((a, b) => a.event_date.localeCompare(b.event_date) || (a.event_time || "").localeCompare(b.event_time || ""))
    .slice(0, 6);

  const selDate = new Date(selected + "T00:00:00");
  const selLabel = `${(ar ? DOW_AR : DOW_EN)[selDate.getDay()]} · ${dayNum(selDate.getDate())} ${(ar ? MONTHS_AR : MONTHS_EN)[selDate.getMonth()]}`;

  const inputStyle: React.CSSProperties = { border: "1px solid #E7E0D3", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, outline: "none", color: "#15324B", background: "#FBFAF6" };

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }} className="fade-up">
      {/* calendar */}
      <div style={{ flex: 2, minWidth: 280, background: "#fff", border: "1px solid #E7E0D3", borderRadius: 18, padding: isMobile ? 13 : 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div className="serif" style={{ fontSize: 20, fontWeight: 600, color: "#102A40" }}>{monthName} {yearLabel}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={goToday} style={{ background: "#F4EEE3", border: "1px solid #E7E0D3", borderRadius: 9, padding: "7px 12px", fontSize: 12.5, fontWeight: 600, color: "#42525C" }}>{ar ? "اليوم" : "Today"}</button>
            <button onClick={() => shift(-1)} style={{ width: 34, height: 34, borderRadius: 9, background: "#F4EEE3", border: "1px solid #E7E0D3", display: "flex", alignItems: "center", justifyContent: "center", color: "#42525C" }}><Icon name={ar ? "chevron_right" : "chevron_left"} size={20} /></button>
            <button onClick={() => shift(1)} style={{ width: 34, height: 34, borderRadius: 9, background: "#F4EEE3", border: "1px solid #E7E0D3", display: "flex", alignItems: "center", justifyContent: "center", color: "#42525C" }}><Icon name={ar ? "chevron_left" : "chevron_right"} size={20} /></button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: isMobile ? 4 : 6 }}>
          {(ar ? DOW_AR : DOW_EN).map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9aa6ad", padding: "2px 0", textTransform: "uppercase", letterSpacing: ".03em" }}>{d}</div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const dIso = iso(cursor.y, cursor.m, d);
            const evs = byDate.get(dIso) ?? [];
            const isToday = dIso === todayIso;
            const isSel = dIso === selected;
            return (
              <button key={i} onClick={() => setSelected(dIso)} style={{ minHeight: isMobile ? 46 : 76, borderRadius: 10, border: `1px solid ${isSel ? "#1E8378" : "#EEE8DC"}`, background: isSel ? "#F2FAF8" : "#fff", padding: isMobile ? 4 : 6, display: "flex", flexDirection: "column", gap: 3, alignItems: isMobile ? "center" : "stretch", textAlign: "start", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: isMobile ? "center" : "space-between", alignItems: "center", width: "100%" }}>
                  <span style={{ fontSize: isMobile ? 12.5 : 12, fontWeight: 700, width: isMobile ? 24 : 22, height: isMobile ? 24 : 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: isToday ? "#102A40" : "transparent", color: isToday ? "#fff" : "#42525C" }}>{dayNum(d)}</span>
                </div>
                {isMobile ? (
                  // compact dots — no text to overflow tiny cells
                  evs.length > 0 && (
                    <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", maxWidth: "100%" }}>
                      {evs.slice(0, 4).map((e) => (
                        <span key={e.id} style={{ width: 5, height: 5, borderRadius: "50%", background: TYPE_META[e.type].color }} />
                      ))}
                    </div>
                  )
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden", width: "100%" }}>
                    {evs.slice(0, 2).map((e) => (
                      <div key={e.id} title={e.title} style={{ fontSize: 9.5, fontWeight: 600, color: TYPE_META[e.type].color, background: TYPE_META[e.type].bg, borderRadius: 4, padding: "1px 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                    ))}
                    {evs.length > 2 && <div style={{ fontSize: 9, color: "#9aa6ad" }}>+{evs.length - 2}</div>}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* legend */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
          {(Object.keys(TYPE_META) as EventType[]).map((k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#6E7C86" }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: TYPE_META[k].color }} />{ar ? TYPE_META[k].ar : TYPE_META[k].en}
            </div>
          ))}
        </div>
      </div>

      {/* side panel: add + day events + upcoming */}
      <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ background: "#fff", border: "1px solid #E7E0D3", borderRadius: 18, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Icon name="add_circle" size={20} color="#1E8378" />
            <div className="serif" style={{ fontSize: 17, fontWeight: 600, color: "#102A40" }}>{ar ? "إضافة حدث" : "Add event"}</div>
          </div>
          <div style={{ fontSize: 12, color: "#6E7C86", marginBottom: 12 }}>{selLabel}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={ar ? "العنوان (مثل: اختبار CS 350)" : "Title (e.g. CS 350 midterm)"} style={inputStyle} />
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              <select value={type} onChange={(e) => setType(e.target.value as EventType)} style={{ ...inputStyle, flex: 1, minWidth: 110, cursor: "pointer" }}>
                {(Object.keys(TYPE_META) as EventType[]).map((k) => <option key={k} value={k}>{ar ? TYPE_META[k].ar : TYPE_META[k].en}</option>)}
              </select>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...inputStyle, width: 120 }} />
            </div>
            <input value={course} onChange={(e) => setCourse(e.target.value)} placeholder={ar ? "المادة (اختياري)" : "Course (optional)"} style={inputStyle} />
            <button onClick={add} style={{ background: "#102A40", color: "#fff", border: "none", borderRadius: 10, padding: 11, fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon name="add" size={18} />{ar ? "أضف الحدث" : "Add event"}</button>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #E7E0D3", borderRadius: 18, padding: 18 }}>
          <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: "#102A40", marginBottom: 12 }}>{ar ? "أحداث هذا اليوم" : "On this day"}</div>
          {selEvents.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "#9aa6ad", padding: "8px 0" }}>{ar ? "لا أحداث في هذا اليوم." : "No events on this day."}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selEvents.map((e) => <EventRow key={e.id} e={e} ar={ar} onDel={() => delEvent(e.id)} />)}
            </div>
          )}
        </div>

        <div style={{ background: "#fff", border: "1px solid #E7E0D3", borderRadius: 18, padding: 18 }}>
          <div className="serif" style={{ fontSize: 16, fontWeight: 600, color: "#102A40", marginBottom: 12 }}>{ar ? "القادمة" : "Upcoming"}</div>
          {upcoming.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "#9aa6ad", padding: "8px 0" }}>{ar ? "لا أحداث قادمة." : "Nothing coming up."}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {upcoming.map((e) => {
                const d = new Date(e.event_date + "T00:00:00");
                const label = `${dayNum(d.getDate())} ${(ar ? MONTHS_AR : MONTHS_EN)[d.getMonth()]}`;
                return <EventRow key={e.id} e={e} ar={ar} dateLabel={label} onDel={() => delEvent(e.id)} />;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventRow({ e, ar, dateLabel, onDel }: { e: CalEvent; ar: boolean; dateLabel?: string; onDel: () => void }) {
  const meta = TYPE_META[e.type];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", border: "1px solid #EEE8DC", borderRadius: 11, background: "#FBFAF6" }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: meta.bg, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={meta.icon} size={17} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#102A40", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
        <div style={{ fontSize: 11.5, color: "#9aa6ad", display: "flex", gap: 7, flexWrap: "wrap" }}>
          <span style={{ color: meta.color, fontWeight: 600 }}>{ar ? meta.ar : meta.en}</span>
          {dateLabel && <span>· {dateLabel}</span>}
          {e.event_time && <span>· {e.event_time}</span>}
          {e.course && <span>· {e.course}</span>}
        </div>
      </div>
      <button onClick={onDel} style={{ background: "none", border: "none", padding: 4, display: "flex", color: "#c2b9ac", flexShrink: 0 }}><Icon name="close" size={17} /></button>
    </div>
  );
}
