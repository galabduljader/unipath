"use client";

import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/data";
import { Icon } from "@/components/ui";
import { toArabicDigits, GRADE_OPTS } from "@/lib/catalog";
import { videos } from "@/lib/content";
import { nodeByCode, stateLabel, levelMeta, STATE_STYLE, type CourseNode } from "@/lib/graph";

// Bottom-sheet detail for one course. Self-contained: reads/writes completion
// and grade via useData. Used by the degree org-chart.
export function CourseDetailSheet({
  code,
  nodes,
  onClose,
  onPick,
}: {
  code: string;
  nodes: CourseNode[];
  onClose: () => void;
  onPick: (code: string) => void;
}) {
  const { lang } = useI18n();
  const { completed, toggleCompleted, grades, setGrade } = useData();
  const ar = lang === "ar";
  const node = nodeByCode(nodes, code);
  if (!node || typeof document === "undefined") return null;

  const m = levelMeta(node.level);
  const ss = STATE_STYLE[node.state];
  const currentGrade = grades[node.code];
  const video = videos(lang).find((v) => v.course === node.code);
  const num = (n: number) => (ar ? toArabicDigits(n) : String(n));
  const prereqNode = node.prereq ? nodeByCode(nodes, node.prereq) : undefined;

  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(16,42,64,.4)", zIndex: 80, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} className="fade-up" style={{ width: "100%", maxWidth: 480, background: "var(--surface)", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: "10px 0 calc(18px + env(safe-area-inset-bottom))", maxHeight: "86vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 14px" }} />
        <div style={{ padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: m.color + "1A", color: m.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={m.icon} size={24} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink-strong)" }}>{node.code}</div>
              <div style={{ fontSize: 13.5, color: "var(--muted)" }}>{node.title}</div>
            </div>
            <button onClick={onClose} aria-label="Close" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 9, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", flexShrink: 0 }}><Icon name="close" size={18} /></button>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 8, background: node.state === "done" ? "#E6F2EF" : node.state === "available" ? "#EAF1F7" : "var(--surface-2)", color: node.state === "done" ? "#156B61" : node.state === "available" ? "#1E5E78" : "#7a868d" }}>
              <Icon name={ss.icon} size={14} />{stateLabel(node.state, lang)}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 8, background: "var(--surface-2)", color: "var(--muted)" }}>{num(node.credits)} {ar ? "ساعة" : "credits"}</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 8, background: m.color + "14", color: m.color }}>{ar ? m.ar : m.en}</span>
          </div>

          {node.state === "locked" && node.blockedBy && (
            <Row icon="lock" color="#B5762E" label={ar ? "تحتاج أولاً" : "Take first"}>
              <button onClick={() => onPick(node.blockedBy!)} style={{ background: "none", border: "none", color: "#B5762E", fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 }}>{node.blockedBy}</button>
            </Row>
          )}
          {node.state !== "locked" && prereqNode && (
            <Row icon="south" color="var(--muted)" label={ar ? "تأتي بعد" : "Comes after"}>
              <button onClick={() => onPick(prereqNode.code)} style={{ background: "none", border: "none", color: "var(--ink-strong)", fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0 }}>{prereqNode.code}</button>
            </Row>
          )}

          {node.unlocks.length > 0 && (
            <Row icon="lock_open" color="#1E8378" label={ar ? "يفتح لك" : "Unlocks"}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {node.unlocks.map((u) => (
                  <button key={u} onClick={() => onPick(u)} style={{ background: "#E6F2EF", color: "#156B61", border: "none", borderRadius: 7, padding: "4px 9px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{u}</button>
                ))}
              </div>
            </Row>
          )}

          {video && (
            <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 14, padding: 11, borderRadius: 12, border: "1px solid var(--border)", textDecoration: "none", background: "var(--surface-2)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={video.thumb} alt={video.title} style={{ width: 64, height: 42, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, color: "#C9281C", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><Icon name="smart_display" size={13} />{ar ? "ادرس هذه المادة" : "Study this course"}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-strong)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{video.title}</div>
              </div>
              <Icon name="open_in_new" size={17} color="var(--faint)" />
            </a>
          )}

          {node.state === "done" && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                <Icon name="grade" size={17} color="#B5762E" />
                <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{ar ? "درجتك (اختياري)" : "Your grade (optional)"}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {GRADE_OPTS.map((g) => {
                  const on = currentGrade === g;
                  return (
                    <button key={g} onClick={() => setGrade(node.code, g, { title: node.title, credits: node.credits })} style={{ minWidth: 40, padding: "7px 10px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700, borderWidth: 1.5, borderStyle: "solid", borderColor: on ? "#1E8378" : "var(--border)", background: on ? "#1E8378" : "var(--surface)", color: on ? "#fff" : "var(--muted)" }}>{g}</button>
                  );
                })}
              </div>
            </div>
          )}

          <button onClick={() => toggleCompleted(node.code)} style={{ width: "100%", marginTop: 16, padding: "13px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: completed.has(node.code) ? "var(--surface-2)" : "#1E8378", color: completed.has(node.code) ? "var(--muted)" : "#fff" }}>
            <Icon name={completed.has(node.code) ? "replay" : "check_circle"} size={19} />
            {completed.has(node.code) ? (ar ? "إلغاء الإكمال" : "Mark as not done") : (ar ? "تمّ إكمالها" : "Mark as completed")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Row({ icon, color, label, children }: { icon: string; color: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: "1px solid var(--border)" }}>
      <Icon name={icon} size={18} color={color} />
      <span style={{ fontSize: 12.5, color: "var(--muted)", minWidth: 86 }}>{label}</span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
