"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/data";
import { Icon, useIsMobile } from "@/components/ui";
import type { CourseTuple } from "@/lib/catalog";
import { toArabicDigits } from "@/lib/catalog";
import { buildGraph } from "@/lib/graph";
import { CourseDetailSheet } from "@/components/CourseDetailSheet";

type Row = {
  id: string; parentId: string;
  code: string; title: string; credits: number; state: string; unlocks: number;
  isRoot?: boolean; major?: string; pct?: number; done?: number; total?: number; grad?: string;
};

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

function renderNode(d: Row, ar: boolean, num: (n: number) => string): string {
  if (d.isRoot) {
    return `<div style="box-sizing:border-box;height:100%;width:100%;border-radius:16px;padding:13px 15px;
      background:linear-gradient(135deg,#102A40,#1E5E78);color:#fff;display:flex;flex-direction:column;justify-content:center;gap:3px;">
      <div style="font-size:11px;opacity:.8;">${ar ? "تخصّصك" : "Your major"}</div>
      <div style="font-size:16px;font-weight:800;line-height:1.1;">${esc(d.major || "")}</div>
      <div style="font-size:12px;opacity:.92;margin-top:3px;">${num(d.pct || 0)}% · ${num(d.done || 0)}/${num(d.total || 0)} ${ar ? "ساعة" : "cr"} · ${ar ? "تخرّج" : "grad"} ${esc(d.grad || "")}</div>
    </div>`;
  }
  const done = d.state === "done", avail = d.state === "available";
  const bg = done ? "#1E8378" : "var(--surface)";
  const border = done ? "2px solid #1E8378" : avail ? "2px solid #1E8378" : "1.5px solid var(--border)";
  const codeCol = done ? "#fff" : "var(--ink-strong)";
  const titleCol = done ? "rgba(255,255,255,.9)" : "var(--muted)";
  const subCol = done ? "rgba(255,255,255,.8)" : "var(--faint)";
  const tag = done ? `<span style="font-size:11px;font-weight:800;color:#fff;">✓</span>`
    : avail ? `<span style="font-size:10px;font-weight:800;color:#1E8378;background:#E1F5EE;padding:2px 7px;border-radius:20px;">${ar ? "متاحة" : "Ready"}</span>`
    : `<span style="font-size:11px;color:#B5762E;">🔒</span>`;
  const unlocks = d.unlocks > 0 ? ` · ${ar ? "يفتح" : "unlocks"} ${num(d.unlocks)}` : "";
  return `<div data-code="${esc(d.code)}" style="box-sizing:border-box;height:100%;width:100%;border-radius:14px;padding:11px 13px;
    background:${bg};border:${border};display:flex;flex-direction:column;justify-content:space-between;opacity:${d.state === "locked" ? ".72" : "1"};cursor:pointer;">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
      <span style="font-weight:800;font-size:14px;color:${codeCol};">${esc(d.code)}</span>${tag}
    </div>
    <div style="font-size:12px;line-height:1.25;color:${titleCol};overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${esc(d.title)}</div>
    <div style="font-size:11px;color:${subCol};">${num(d.credits)} ${ar ? "ساعة" : "cr"}${unlocks}</div>
  </div>`;
}

export function MajorOrgChart({ planCourses, total, gradTerm, major }: { planCourses: CourseTuple[]; total: number; gradTerm: string; major: string }) {
  const { lang } = useI18n();
  const { completed } = useData();
  const isMobile = useIsMobile();
  const ar = lang === "ar";
  const num = (n: number) => (ar ? toArabicDigits(n) : String(n));
  const nodes = useMemo(() => buildGraph(planCourses, completed), [planCourses, completed]);
  const [sel, setSel] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  const data = useMemo<Row[]>(() => {
    const codes = new Set(nodes.map((n) => n.code));
    const doneCredits = nodes.filter((n) => n.state === "done").reduce((a, n) => a + n.credits, 0);
    const pct = total ? Math.round((doneCredits / total) * 100) : 0;
    const rows: Row[] = [{ id: "ROOT", parentId: "", code: "", title: "", credits: 0, state: "root", unlocks: 0, isRoot: true, major, pct, done: doneCredits, total, grad: gradTerm }];
    for (const n of nodes) {
      const parent = n.prereq && codes.has(n.prereq) ? n.prereq : "ROOT";
      rows.push({ id: n.code, parentId: parent, code: n.code, title: n.title, credits: n.credits, state: n.state, unlocks: n.unlocks.length });
    }
    return rows;
  }, [nodes, total, major, gradTerm]);

  // robust drill-down: delegate clicks on injected node HTML (works regardless
  // of how the chart lib wraps node content)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const t = (e.target as HTMLElement | null)?.closest?.("[data-code]");
      const code = t?.getAttribute("data-code");
      if (code) setSel(code);
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
        .data(data)
        .nodeWidth(() => (isMobile ? 172 : 220))
        .nodeHeight(() => (isMobile ? 90 : 92))
        .childrenMargin(() => (isMobile ? 38 : 46))
        .siblingsMargin(() => (isMobile ? 12 : 16))
        .compactMarginBetween(() => 22)
        .initialExpandLevel(isMobile ? 1 : 2)
        .setActiveNodeCentered(true)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .onNodeClick((node: any) => { const id = node?.data?.id; if (id && id !== "ROOT") setSel(id); })
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
  }, [data, ar, isMobile]);

  // re-lay-out (re-centered) when the container resizes: rotation, breakpoint,
  // sidebar collapse, window resize — keeps the tree neatly centered.
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

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>
      <div style={{ background: "linear-gradient(135deg,#102A40,#1E5E78)", color: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, opacity: 0.85, fontWeight: 600 }}><Icon name="account_tree" size={17} />{ar ? "خريطة تخصّصك" : "Your degree map"}</div>
          <div className="serif" style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{ar ? "كل مادة، ومتى تأخذها" : "Every course, and when to take it"}</div>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11.5 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, opacity: 0.92 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "#1E8378" }} />{ar ? "مكتملة" : "Done"}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, opacity: 0.92 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "#fff", border: "2px solid #1E8378" }} />{ar ? "متاحة" : "Available"}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, opacity: 0.92 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: "rgba(255,255,255,.25)" }} />{ar ? "مقفلة" : "Locked"}</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)", padding: "9px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="touch_app" size={15} color="#2C6E91" />{ar ? "انقر مادة للتفاصيل · اسحب للتنقّل · + للتوسيع" : "Tap a course for details · drag to pan · + to expand"}
      </div>

      {/* framed, responsive canvas */}
      <div style={{ position: "relative", padding: isMobile ? 10 : 14 }}>
        <div style={{ position: "absolute", top: isMobile ? 20 : 24, insetInlineEnd: isMobile ? 20 : 24, zIndex: 5, display: "flex", gap: 6 }}>
          <CanvasBtn icon="center_focus_strong" label={ar ? "إعادة التوسيط" : "Re-center"} onClick={() => { try { chartRef.current?.render(); } catch { /* noop */ } }} />
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
      {sel && <CourseDetailSheet code={sel} nodes={nodes} onClose={() => setSel(null)} onPick={setSel} />}
    </div>
  );
}

function CanvasBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 4px rgba(16,42,64,.12)" }}
    >
      <Icon name={icon} size={19} />
    </button>
  );
}
