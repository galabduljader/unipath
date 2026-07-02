"use client";

// The prerequisite map rendered as a d3-org-chart (matching the app's existing
// degree-chart look). A course can have several prerequisites, but an org-chart is
// a strict tree — so each course hangs off ONE primary parent (its deepest
// prerequisite, i.e. the main spine), and every OTHER relationship — extra
// prerequisites, OR-alternatives, and corequisites — is drawn as a d3-org-chart
// "connection" (a secondary curved link), styled distinctly with a legend.

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/data";
import { Icon, useIsMobile } from "@/components/ui";
import { toArabicDigits } from "@/lib/catalog";
import { levelOf, type CourseNode, type NodeState } from "@/lib/graph";
import { CourseDetailSheet } from "@/components/CourseDetailSheet";
import type { Course } from "@/lib/schema/majorSheet";
import { toCourseKey } from "@/lib/schema/majorSheet";
import { computeStatuses, prereqDepth, type CourseEdge, type CourseStatus } from "@/lib/majorSheet/graph";

type Row = {
  id: string;
  parentId: string;
  code: string;
  title: string;
  credits: number;
  status: CourseStatus | "root";
  unlocks: number;
  standing: string | null;
  needsReview: boolean;
  isRoot?: boolean;
  major?: string;
  pct?: number;
  done?: number;
  total?: number;
};

type Conn = { from: string; to: string; label?: string; kind: "prerequisite" | "corequisite"; alt: boolean };

const numOf = (code: string) => {
  const m = code.match(/(\d{3})/);
  return m ? parseInt(m[1], 10) : 100;
};
const deptKey = (code: string) => code.split(/[\s]/)[0];

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

function renderNode(d: Row, ar: boolean, num: (n: number) => string): string {
  if (d.isRoot) {
    return `<div style="box-sizing:border-box;height:100%;width:100%;border-radius:16px;padding:13px 15px;
      background:linear-gradient(135deg,#102A40,#1E5E78);color:#fff;display:flex;flex-direction:column;justify-content:center;gap:3px;">
      <div style="font-size:11px;opacity:.8;">${ar ? "خطة تخصّصك" : "Your degree plan"}</div>
      <div style="font-size:16px;font-weight:800;line-height:1.1;">${esc(d.major || "")}</div>
      <div style="font-size:12px;opacity:.92;margin-top:3px;">${num(d.pct || 0)}% · ${num(d.done || 0)}/${num(d.total || 0)} ${ar ? "ساعة" : "cr"}</div>
    </div>`;
  }
  const st = d.status as CourseStatus;
  const done = st === "completed";
  const prog = st === "in_progress";
  const avail = st === "available";
  const bg = done ? "#1E8378" : prog ? "#2C6E91" : "var(--surface)";
  const border = done ? "2px solid #1E8378" : prog ? "2px solid #2C6E91" : avail ? "2px solid #1E8378" : "1.5px solid var(--border)";
  const solid = done || prog;
  const codeCol = solid ? "#fff" : "var(--ink-strong)";
  const titleCol = solid ? "rgba(255,255,255,.9)" : "var(--muted)";
  const subCol = solid ? "rgba(255,255,255,.8)" : "var(--faint)";
  const tag = done
    ? `<span style="font-size:11px;font-weight:800;color:#fff;">✓</span>`
    : prog
    ? `<span style="font-size:9.5px;font-weight:800;color:#fff;background:rgba(255,255,255,.22);padding:2px 7px;border-radius:20px;">${ar ? "جارية" : "Now"}</span>`
    : avail
    ? `<span style="font-size:10px;font-weight:800;color:#1E8378;background:#E1F5EE;padding:2px 7px;border-radius:20px;">${ar ? "متاحة" : "Ready"}</span>`
    : `<span style="font-size:11px;color:#B5762E;">🔒</span>`;
  const badgeBg = solid ? "rgba(255,255,255,.2)" : "#F6ECD7";
  const badgeCol = solid ? "#fff" : "#B5762E";
  const standing = d.standing
    ? `<span style="font-size:9px;font-weight:700;color:${badgeCol};background:${badgeBg};padding:1px 6px;border-radius:20px;">${d.standing === "senior" ? (ar ? "سنة متقدّمة" : "Senior") : (ar ? "سنة متوسطة" : "Junior")}</span>`
    : "";
  const review = d.needsReview
    ? `<span style="font-size:9px;font-weight:700;color:${solid ? "#fff" : "#B5564E"};background:${solid ? "rgba(255,255,255,.2)" : "#FBECEC"};padding:1px 6px;border-radius:20px;">${ar ? "مراجعة" : "review"}</span>`
    : "";
  const unlocks = d.unlocks > 0 ? ` · ${ar ? "يفتح" : "unlocks"} ${num(d.unlocks)}` : "";
  return `<div data-key="${esc(d.id)}" style="box-sizing:border-box;height:100%;width:100%;border-radius:14px;padding:10px 12px;
    background:${bg};border:${border};display:flex;flex-direction:column;justify-content:space-between;gap:4px;opacity:${st === "locked" ? ".75" : "1"};cursor:pointer;">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
      <span style="font-weight:800;font-size:14px;color:${codeCol};">${esc(d.code)}</span>${tag}
    </div>
    <div style="font-size:12px;line-height:1.25;color:${titleCol};overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${esc(d.title)}</div>
    <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
      <span style="font-size:11px;color:${subCol};">${num(d.credits)} ${ar ? "ساعة" : "cr"}${unlocks}</span>${standing}${review}
    </div>
  </div>`;
}

const CONN_STYLE: Record<string, { stroke: string; dash: string; width: string }> = {
  prerequisite: { stroke: "#2C6E91", dash: "", width: "1.6" },
  alternative: { stroke: "#6B8E9E", dash: "7 5", width: "1.6" },
  corequisite: { stroke: "#B5762E", dash: "2 4", width: "1.6" },
};

export function PrerequisiteOrgChart({
  courses,
  edges,
  program,
}: {
  courses: Course[];
  edges: CourseEdge[];
  program?: string | null;
}) {
  const { lang } = useI18n();
  const { completed } = useData();
  const isMobile = useIsMobile();
  const ar = lang === "ar";
  const num = (n: number) => (ar ? toArabicDigits(n) : String(n));
  const [selKey, setSelKey] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  const major = program || (ar ? "تخصّصك" : "Your major");

  const model = useMemo(() => {
    const completedKeys = new Set([...completed].map(toCourseKey));
    const statuses = computeStatuses(courses, { completed: completedKeys });
    const depth = prereqDepth(courses, edges);
    const byKey = new Map(courses.map((c) => [c.id, c]));

    // Direct prerequisite sources / dependents per course (prereq edges only).
    const incoming = new Map<string, string[]>();
    const outgoing = new Map<string, string[]>();
    for (const e of edges) {
      if (e.kind !== "prerequisite") continue;
      if (!byKey.has(e.sourceKey) || !byKey.has(e.targetKey)) continue;
      (incoming.get(e.targetKey) ?? incoming.set(e.targetKey, []).get(e.targetKey)!).push(e.sourceKey);
      (outgoing.get(e.sourceKey) ?? outgoing.set(e.sourceKey, []).get(e.sourceKey)!).push(e.targetKey);
    }

    // Primary parent = the prerequisite with the greatest depth (the main spine).
    const primaryOf = new Map<string, string | null>();
    for (const c of courses) {
      const srcs = incoming.get(c.id) ?? [];
      let best: string | null = null;
      for (const s of srcs) {
        if (best === null || (depth.get(s) ?? 0) > (depth.get(best) ?? 0) || ((depth.get(s) ?? 0) === (depth.get(best) ?? 0) && s < best)) best = s;
      }
      primaryOf.set(c.id, best);
    }

    // Rows for the org chart (ROOT + one per course).
    const nonExternal = courses.filter((c) => !c.external);
    const doneCredits = nonExternal.filter((c) => statuses.get(c.id) === "completed").reduce((a, c) => a + c.credits, 0);
    const total = nonExternal.reduce((a, c) => a + c.credits, 0);
    const pct = total ? Math.round((doneCredits / total) * 100) : 0;

    const rows: Row[] = [
      { id: "ROOT", parentId: "", code: "", title: "", credits: 0, status: "root", unlocks: 0, standing: null, needsReview: false, isRoot: true, major, pct, done: doneCredits, total },
    ];
    for (const c of courses) {
      rows.push({
        id: c.id,
        parentId: primaryOf.get(c.id) ?? "ROOT",
        code: c.code,
        title: ar && c.nameAr ? c.nameAr : c.name,
        credits: c.credits,
        status: statuses.get(c.id) ?? "locked",
        unlocks: (outgoing.get(c.id) ?? []).length,
        standing: c.standing,
        needsReview: c.needsReview,
      });
    }

    // Connections: every prerequisite edge that ISN'T the primary tree link, plus
    // all corequisite edges. Alternatives are flagged so they render dashed.
    const conns: Conn[] = [];
    for (const e of edges) {
      if (!byKey.has(e.sourceKey) || !byKey.has(e.targetKey)) continue;
      if (e.kind === "prerequisite") {
        if (primaryOf.get(e.targetKey) === e.sourceKey) continue; // drawn as the tree link
        conns.push({ from: e.sourceKey, to: e.targetKey, kind: "prerequisite", alt: e.isAlternative });
      } else {
        conns.push({ from: e.sourceKey, to: e.targetKey, kind: "corequisite", alt: false });
      }
    }

    // Synthesize old-shape CourseNode[] so we can reuse CourseDetailSheet as-is.
    const detailNodes: CourseNode[] = courses.map((c) => {
      const primary = primaryOf.get(c.id);
      const srcs = incoming.get(c.id) ?? [];
      const blocked = srcs.filter((s) => !completedKeys.has(s)).sort((a, b) => (depth.get(b) ?? 0) - (depth.get(a) ?? 0))[0] ?? null;
      const st = statuses.get(c.id) ?? "locked";
      const state: NodeState = st === "completed" || st === "in_progress" ? (st === "completed" ? "done" : "available") : st === "available" ? "available" : "locked";
      return {
        code: c.code,
        title: ar && c.nameAr ? c.nameAr : c.name,
        credits: c.credits,
        dept: deptKey(c.code),
        num: numOf(c.code),
        level: levelOf(c.code),
        state,
        prereq: primary ? byKey.get(primary)?.code ?? null : null,
        unlocks: (outgoing.get(c.id) ?? []).map((k) => byKey.get(k)?.code).filter((x): x is string => Boolean(x)),
        blockedBy: blocked ? byKey.get(blocked)?.code ?? null : null,
      };
    });

    const codeToKey = new Map(courses.map((c) => [c.code, c.id]));
    return { rows, conns, detailNodes, codeToKey };
  }, [courses, edges, completed, ar, major]);

  // Robust drill-down: delegate clicks on injected node HTML.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const t = (e.target as HTMLElement | null)?.closest?.("[data-key]");
      const key = t?.getAttribute("data-key");
      if (key) setSelKey(key);
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    let disposed = false;
    (async () => {
      const { OrgChart } = await import("d3-org-chart");
      if (disposed || !containerRef.current) return;
      if (!chartRef.current) chartRef.current = new OrgChart();
      chartRef.current
        .container(containerRef.current)
        .data(model.rows)
        .connections(model.conns as unknown as { from: string; to: string; label?: string }[])
        .nodeWidth(() => (isMobile ? 176 : 216))
        .nodeHeight(() => (isMobile ? 96 : 98))
        .childrenMargin(() => (isMobile ? 40 : 50))
        .siblingsMargin(() => (isMobile ? 14 : 20))
        .compactMarginBetween(() => 24)
        .initialExpandLevel(20)
        .setActiveNodeCentered(true)
        .connectionsUpdate(function (this: SVGPathElement, d: unknown) {
          const c = d as Conn;
          const key = c.kind === "corequisite" ? "corequisite" : c.alt ? "alternative" : "prerequisite";
          const s = CONN_STYLE[key];
          this.setAttribute("stroke", s.stroke);
          this.setAttribute("stroke-width", s.width);
          this.setAttribute("stroke-linecap", "round");
          this.setAttribute("fill", "none");
          this.setAttribute("pointer-events", "none");
          if (s.dash) this.setAttribute("stroke-dasharray", s.dash);
          else this.removeAttribute("stroke-dasharray");
          this.removeAttribute("marker-start");
          this.removeAttribute("marker-end");
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .buttonContent(({ node }: any) => {
          const expanded = node.children;
          const n = node.data?._directSubordinates || 0;
          return `<div style="display:flex;align-items:center;gap:4px;border-radius:20px;padding:3px 10px;font-size:12px;font-weight:700;background:#102A40;color:#fff;border:2px solid var(--surface);">${expanded ? "−" : "+"} ${num(n)}</div>`;
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .nodeContent((d: any) => renderNode(d.data as Row, ar, num))
        .render();
    })();
    return () => { disposed = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, ar, isMobile]);

  // Re-center on container resize (rotation, breakpoint, sidebar collapse).
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { try { chartRef.current?.render(); } catch { /* noop */ } });
    });
    ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  const selCode = selKey ? model.detailNodes.find((n) => n.code === courses.find((c) => c.id === selKey)?.code)?.code ?? null : null;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>
      <div style={{ background: "linear-gradient(135deg,#102A40,#1E5E78)", color: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, opacity: 0.85, fontWeight: 600 }}><Icon name="account_tree" size={17} />{ar ? "خريطة المتطلّبات" : "Prerequisite map"}</div>
          <div className="serif" style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{ar ? "كل مادة، وما تفتحه" : "Every course, and what it unlocks"}</div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11.5 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, opacity: 0.92 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "#1E8378" }} />{ar ? "مكتملة" : "Done"}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, opacity: 0.92 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "#fff", border: "2px solid #1E8378" }} />{ar ? "متاحة" : "Available"}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, opacity: 0.92 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "rgba(255,255,255,.25)" }} />{ar ? "مقفلة" : "Locked"}</span>
        </div>
      </div>

      {/* edge legend + hint */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "9px 16px", borderBottom: "1px solid var(--border)", fontSize: 11.5, color: "var(--muted)", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><LineSwatch dash={undefined} color="#2C6E91" />{ar ? "متطلّب سابق" : "Prerequisite"}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><LineSwatch dash="7 5" color="#6B8E9E" />{ar ? "بديل (أو)" : "Alternative (OR)"}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><LineSwatch dash="2 4" color="#B5762E" />{ar ? "متزامن" : "Corequisite"}</span>
        <span style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 6 }}><Icon name="touch_app" size={15} color="#2C6E91" />{ar ? "انقر مادة للتفاصيل · + للتوسيع" : "Tap a course for details · + to expand"}</span>
      </div>

      <div style={{ position: "relative", padding: isMobile ? 10 : 14 }}>
        <div style={{ position: "absolute", top: isMobile ? 20 : 24, insetInlineEnd: isMobile ? 20 : 24, zIndex: 5, display: "flex", gap: 6 }}>
          <CanvasBtn icon="center_focus_strong" label={ar ? "إعادة التوسيط" : "Re-center"} onClick={() => { try { chartRef.current?.fit(); } catch { /* noop */ } }} />
          <CanvasBtn
            icon={allExpanded ? "unfold_less" : "unfold_more"}
            label={allExpanded ? (ar ? "طيّ الكل" : "Collapse all") : (ar ? "توسيع الكل" : "Expand all")}
            onClick={() => {
              try {
                if (allExpanded) chartRef.current?.collapseAll(); else chartRef.current?.expandAll();
                setAllExpanded((v) => !v);
              } catch { /* noop */ }
            }}
          />
        </div>
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: isMobile ? "min(64vh, 500px)" : "min(72vh, 640px)",
            minHeight: isMobile ? 340 : 460,
            borderRadius: 14,
            border: "1px solid var(--border)",
            overflow: "hidden",
            background: "var(--surface-2)",
            backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>
      {selCode && <CourseDetailSheet code={selCode} nodes={model.detailNodes} onClose={() => setSelKey(null)} onPick={(code) => setSelKey(model.codeToKey.get(code) ?? null)} />}
    </div>
  );
}

function LineSwatch({ dash, color }: { dash: string | undefined; color: string }) {
  return (
    <svg width={22} height={8} viewBox="0 0 22 8" aria-hidden>
      <line x1={1} y1={4} x2={21} y2={4} stroke={color} strokeWidth={2} strokeDasharray={dash} />
    </svg>
  );
}

function CanvasBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 4px rgba(16,42,64,.12)" }}>
      <Icon name={icon} size={19} />
    </button>
  );
}
