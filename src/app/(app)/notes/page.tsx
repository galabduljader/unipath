"use client";

import { useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/data";
import { Icon } from "@/components/ui";
import { fmtDue } from "@/lib/catalog";

const REMINDER_COURSES = ["—", "CS 340", "CS 350", "CS 360", "STAT 320", "ENGL 210", "HUM 300"];

export default function NotesPage() {
  const { t, lang } = useI18n();
  const { reminders, notes, addReminder, toggleReminder, delReminder, saveNotes } = useData();
  const textRef = useRef<HTMLInputElement>(null);
  const dueRef = useRef<HTMLInputElement>(null);
  const courseRef = useRef<HTMLSelectElement>(null);

  async function add() {
    const text = textRef.current?.value.trim() || "";
    if (!text) return;
    await addReminder({ text, due: dueRef.current?.value || "", course: courseRef.current?.value || "" });
    if (textRef.current) textRef.current.value = "";
    if (dueRef.current) dueRef.current.value = "";
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }} className="fade-up">
      <div style={{ flex: 1, minWidth: 300, background: "#fff", border: "1px solid #E7E0D3", borderRadius: 18, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
          <Icon name="checklist" size={21} color="#1E8378" />
          <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "#102A40" }}>{t.notesTitle}</div>
        </div>
        <div style={{ fontSize: 12.5, color: "#6E7C86", marginBottom: 14 }}>{t.notesSub}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <input ref={textRef} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={t.reminderPh} style={{ flex: 1, minWidth: 140, border: "1px solid #E7E0D3", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, outline: "none", color: "#15324B", background: "#FBFAF6" }} />
          <input ref={dueRef} type="date" style={{ border: "1px solid #E7E0D3", borderRadius: 10, padding: "9px 11px", fontSize: 12.5, outline: "none", color: "#42525C", background: "#FBFAF6" }} />
          <select ref={courseRef} style={{ border: "1px solid #E7E0D3", borderRadius: 10, padding: "9px 11px", fontSize: 12.5, outline: "none", color: "#42525C", background: "#FBFAF6" }}>
            {REMINDER_COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={add} style={{ background: "#1E8378", color: "#fff", border: "none", borderRadius: 10, padding: "10px 15px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><Icon name="add" size={17} />{t.addReminder}</button>
        </div>
        {reminders.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reminders.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", border: "1px solid #E7E0D3", borderRadius: 11, background: "#FBFAF6" }}>
                <button onClick={() => toggleReminder(r.id)} style={{ background: "none", border: "none", padding: 0, display: "flex" }}><Icon name={r.done ? "check_circle" : "radio_button_unchecked"} size={22} color={r.done ? "#1E8378" : "#cdd5d9"} /></button>
                <div style={{ flex: 1, textAlign: "start", fontSize: 13.5, color: r.done ? "#9aa6ad" : "#2b3a44", textDecoration: r.done ? "line-through" : "none" }}>{r.text}</div>
                {r.course && <span style={{ background: "#EAF1F7", color: "#2C6E91", fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{r.course}</span>}
                {r.due && <span style={{ fontSize: 11.5, color: "#9aa6ad", display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}><Icon name="event" size={14} />{fmtDue(r.due, lang)}</span>}
                <button onClick={() => delReminder(r.id)} style={{ background: "none", border: "none", padding: 0, display: "flex", color: "#c2b9ac" }}><Icon name="close" size={18} /></button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: 26, color: "#9aa6ad", fontSize: 13 }}>{t.noReminders}</div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 300, background: "#fff", border: "1px solid #E7E0D3", borderRadius: 18, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Icon name="edit_note" size={21} color="#7A5AA8" />
            <div className="serif" style={{ fontSize: 19, fontWeight: 600, color: "#102A40" }}>{t.notepad}</div>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#1E8378", fontWeight: 600 }}><Icon name="cloud_done" size={15} />{t.saved}</span>
        </div>
        <div style={{ fontSize: 12.5, color: "#6E7C86", marginBottom: 14 }}>{t.notepadSub}</div>
        <textarea value={notes} onChange={(e) => saveNotes(e.target.value)} style={{ width: "100%", minHeight: 300, resize: "vertical", border: "1px solid #E7E0D3", borderRadius: 12, padding: 14, fontSize: 13.5, lineHeight: 1.6, outline: "none", color: "#2b3a44", background: "#FBFAF6" }} />
      </div>
    </div>
  );
}
