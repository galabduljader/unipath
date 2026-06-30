"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/data";
import { Icon } from "@/components/ui";
import type { CourseTuple } from "@/lib/catalog";
import { toArabicDigits } from "@/lib/catalog";
import { videos } from "@/lib/content";
import {
  buildGraph,
  stagesOf,
  suggestedNext,
  nodeByCode,
  stateLabel,
  levelMeta,
  STATE_STYLE,
  type CourseNode,
} from "@/lib/graph";

export function DegreeMindMap({
  planCourses,
  total,
  gradTerm,
}: {
  planCourses: CourseTuple[];
  total: number;
  gradTerm: string;
}) {
  const { t, lang } = useI18n();
  const { completed, toggleCompleted } = useData();
  const ar = lang === "ar";
  const num = (n: number) => (ar ? toArabicDigits(n) : String(n));

  const nodes = useMemo(() => buildGraph(planCourses, completed), [planCourses, completed]);
  const stages = useMemo(() => stagesOf(nodes), [nodes]);
  const suggestions = useMemo(() => suggestedNext(nodes, 4), [nodes]);

  const doneCredits = nodes.filter((n) => n.state === "done").reduce((a, n) => a + n.credits, 0);
  const pct = total ? Math.min(100, Math.round((doneCredits / total) * 100)) : 0;

  // open the first stage that still has an available course; else the first.
  const initialOpen = useMemo(() => {
    const s = stages.find((st) => st.nodes.some((n) => n.state === "available")) ?? stages[0];
    return s ? { [s.level]: true } : {};
  }, [stages]);
  const [open, setOpen] = useState<Record<number, boolean>>(initialOpen);
  const [selCode, setSelCode] = useState<string | null>(null);
  const sel = selCode ? nodeByCode(nodes, selCode) : undefined;

  const toggle = (lvl: number) => setOpen((p) => ({ ...p, [lvl]: !p[lvl] }));

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>
      {/* hero header */}
      <div style={{ background: "linear-gradient(135deg,#102A40,#1E5E78)", color: "#fff", padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, opacity: 0.85, fontWeight: 600, marginBottom: 6 }}>
          <Icon name="account_tree" size={17} />{ar ? "خريطة تخصّصك" : "Your Degree Map"}
        </div>
        <div className="serif" style={{ fontSize: 23, fontWeight: 700, lineHeight: 1.15 }}>
          {ar ? "كل مادة، ومتى تأخذها" : "Every course, and when to take it"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.9, marginBottom: 5 }}>
              <span>{num(doneCredits)} / {num(total)} {ar ? "ساعة" : "credits"}</span>
              <span>{num(pct)}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 5, background: "rgba(255,255,255,.2)", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 5, background: "linear-gradient(90deg,#3FB6A0,#7FD7C8)", transition: "width .6s" }} />
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,.14)", borderRadius: 11, padding: "8px 13px", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="school" size={18} />
            <div>
              <div style={{ fontSize: 10.5, opacity: 0.8 }}>{ar ? "التخرّج المتوقّع" : "Expected graduation"}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{gradTerm}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 20px" }}>
        {/* suggestions */}
        {suggestions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--ink-strong)", marginBottom: 9 }}>
              <Icon name="auto_awesome" size={16} color="#1E8378" />{ar ? "موصى بها الآن" : "Recommended next"}
            </div>
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              {suggestions.map((n) => (
                <button
                  key={n.code}
                  onClick={() => setSelCode(n.code)}
                  style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--surface)", border: "1.5px solid #1E8378", borderRadius: 12, padding: "8px 12px", cursor: "pointer", textAlign: "start", animation: "ready-glow 2.4s ease-in-out infinite" }}
                >
                  <Icon name="bolt" size={15} color="#1E8378" />
                  <span>
                    <span style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--ink-strong)" }}>{n.code}</span>
                    <span style={{ display: "block", fontSize: 10.5, color: "var(--muted)", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* legend */}
        <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
          {([["done", ar ? "مكتملة" : "Done"], ["available", ar ? "متاحة" : "Available"], ["locked", ar ? "مقفلة" : "Locked"]] as const).map(([st, lbl]) => (
            <div key={st} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted)" }}>
              <span style={{ width: 11, height: 11, borderRadius: 4, background: st === "locked" ? "var(--surface-2)" : STATE_STYLE[st].bg, borderWidth: 1.5, borderStyle: "solid", borderColor: STATE_STYLE[st].border }} />
              {lbl}
            </div>
          ))}
        </div>

        {/* the branching map */}
        <div style={{ position: "relative" }}>
          {/* central spine */}
          <div style={{ position: "absolute", insetInlineStart: 21, top: 30, bottom: 30, width: 2, background: "var(--border)" }} />

          {/* root */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, position: "relative" }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#102A40,#1E5E78)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, zIndex: 1 }}>
              <Icon name="hub" size={24} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 600 }}>{ar ? "تخصّصك" : "Your major"}</div>
              <div className="serif" style={{ fontSize: 18, fontWeight: 700, color: "var(--ink-strong)" }}>{ar ? "الطريق إلى التخرّج" : "The road to graduation"}</div>
            </div>
          </div>

          {/* level branches */}
          {stages.map((stage) => {
            const m = stage.meta;
            const isOpen = !!open[stage.level];
            const stagePct = stage.total ? Math.round((stage.done / stage.total) * 100) : 0;
            return (
              <div key={stage.level} style={{ position: "relative", marginTop: 12, paddingInlineStart: 56 }}>
                {/* connector node on the spine */}
                <div style={{ position: "absolute", insetInlineStart: 14, top: 16, width: 16, height: 16, borderRadius: "50%", background: m.color, borderWidth: 3, borderStyle: "solid", borderColor: "var(--surface)", zIndex: 1 }} />

                <button
                  onClick={() => toggle(stage.level)}
                  style={{ width: "100%", textAlign: "start", background: "var(--surface)", borderWidth: 1, borderStyle: "solid", borderColor: isOpen ? m.color : "var(--border)", borderRadius: 14, padding: "13px 15px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: m.color + "1A", color: m.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={m.icon} size={21} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink-strong)" }}>{ar ? m.ar : m.en}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: m.color, background: m.color + "14", padding: "2px 8px", borderRadius: 6 }}>{num(stage.done)}/{num(stage.total)}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{ar ? m.sub_ar : m.sub_en}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 46, height: 5, borderRadius: 3, background: "var(--surface-2)", overflow: "hidden" }}>
                      <div style={{ width: `${stagePct}%`, height: "100%", background: m.color }} />
                    </div>
                    <Icon name={isOpen ? "expand_less" : "expand_more"} size={22} color="var(--faint)" />
                  </div>
                </button>

                {isOpen && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 9, padding: "11px 2px 4px" }} className="fade-up">
                    {stage.nodes.map((n) => {
                      const ss = STATE_STYLE[n.state];
                      const isAvail = n.state === "available";
                      return (
                        <button
                          key={n.code}
                          onClick={() => setSelCode(n.code)}
                          style={{
                            textAlign: "start", cursor: "pointer", borderRadius: 12, padding: "11px 12px",
                            background: n.state === "done" ? "#1E8378" : "var(--surface)",
                            borderWidth: 1.5, borderStyle: isAvail ? "solid" : "solid",
                            borderColor: n.state === "done" ? "#1E8378" : isAvail ? "#1E8378" : "var(--border)",
                            opacity: n.state === "locked" ? 0.72 : 1,
                            display: "flex", flexDirection: "column", gap: 5,
                            boxShadow: isAvail ? "0 0 0 3px rgba(30,131,120,.12)" : "none",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: n.state === "done" ? "#fff" : "var(--ink-strong)" }}>{n.code}</span>
                            <Icon name={ss.icon} size={16} color={n.state === "done" ? "#fff" : isAvail ? "#1E8378" : "#9aa6ad"} />
                          </div>
                          <span style={{ fontSize: 11.5, lineHeight: 1.3, color: n.state === "done" ? "rgba(255,255,255,.9)" : "var(--muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.title}</span>
                          <span style={{ fontSize: 10.5, color: n.state === "done" ? "rgba(255,255,255,.8)" : "var(--faint)" }}>{num(n.credits)} {ar ? "ساعة" : "cr"}{n.unlocks.length ? ` · ${ar ? "يفتح" : "unlocks"} ${num(n.unlocks.length)}` : ""}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* drill-down sheet */}
      {sel && <CourseDetail node={sel} nodes={nodes} onClose={() => setSelCode(null)} onPick={(c) => setSelCode(c)} onToggleDone={() => toggleCompleted(sel.code)} />}
    </div>
  );
}

function CourseDetail({
  node,
  nodes,
  onClose,
  onPick,
  onToggleDone,
}: {
  node: CourseNode;
  nodes: CourseNode[];
  onClose: () => void;
  onPick: (code: string) => void;
  onToggleDone: () => void;
}) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const m = levelMeta(node.level);
  const ss = STATE_STYLE[node.state];
  const video = videos(lang).find((v) => v.course === node.code);
  const num = (n: number) => (ar ? toArabicDigits(n) : String(n));
  const prereqNode = node.prereq ? nodeByCode(nodes, node.prereq) : undefined;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(16,42,64,.4)", zIndex: 80, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-up"
        style={{ width: "100%", maxWidth: 480, background: "var(--surface)", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: "10px 0 calc(18px + env(safe-area-inset-bottom))", maxHeight: "86vh", overflowY: "auto" }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 14px" }} />
        <div style={{ padding: "0 20px" }}>
          {/* header */}
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

          {/* meta chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 8, background: node.state === "done" ? "#E6F2EF" : node.state === "available" ? "#EAF1F7" : "var(--surface-2)", color: node.state === "done" ? "#156B61" : node.state === "available" ? "#1E5E78" : "#7a868d" }}>
              <Icon name={ss.icon} size={14} />{stateLabel(node.state, lang)}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 8, background: "var(--surface-2)", color: "var(--muted)" }}>{num(node.credits)} {ar ? "ساعة" : "credits"}</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "5px 11px", borderRadius: 8, background: m.color + "14", color: m.color }}>{ar ? m.ar : m.en}</span>
          </div>

          {/* prereq / blocker */}
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

          {/* unlocks */}
          {node.unlocks.length > 0 && (
            <Row icon="lock_open" color="#1E8378" label={ar ? "يفتح لك" : "Unlocks"}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {node.unlocks.map((u) => (
                  <button key={u} onClick={() => onPick(u)} style={{ background: "#E6F2EF", color: "#156B61", border: "none", borderRadius: 7, padding: "4px 9px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{u}</button>
                ))}
              </div>
            </Row>
          )}

          {/* study video */}
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

          {/* action */}
          <button
            onClick={() => { onToggleDone(); }}
            style={{ width: "100%", marginTop: 16, padding: "13px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: node.state === "done" ? "var(--surface-2)" : "#1E8378", color: node.state === "done" ? "var(--muted)" : "#fff" }}
          >
            <Icon name={node.state === "done" ? "replay" : "check_circle"} size={19} />
            {node.state === "done" ? (ar ? "إلغاء الإكمال" : "Mark as not done") : (ar ? "تمّ إكمالها" : "Mark as completed")}
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
