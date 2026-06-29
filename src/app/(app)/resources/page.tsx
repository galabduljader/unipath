"use client";

import { useI18n } from "@/lib/i18n";
import { Icon, useIsMobile } from "@/components/ui";
import { videos, tutors } from "@/lib/content";

export default function ResourcesPage() {
  const { t, lang } = useI18n();
  const isMobile = useIsMobile();
  const grid = isMobile ? "1fr" : "repeat(auto-fill,minmax(240px,1fr))";
  const vids = videos(lang);
  const tts = tutors(lang);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22 }} className="fade-up">
      <div style={{ display: "flex", gap: 11, alignItems: "center", background: "#EEE7F4", border: "1px solid #ddd0e8", borderRadius: 13, padding: "13px 16px" }}>
        <Icon name="auto_awesome" size={20} color="#7A5AA8" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: "#4a3d5e" }}>{t.resourcesIntro}</div>
      </div>

      <div>
        <div className="serif" style={{ fontSize: 21, fontWeight: 600, color: "var(--ink-strong)" }}>{t.videoSources}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>{t.videoSourcesSub}</div>
        <div style={{ display: "grid", gridTemplateColumns: grid, gap: 14 }}>
          {vids.map((v, i) => (
            <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", background: "var(--surface)" }}>
              <div style={{ height: 118, background: `repeating-linear-gradient(135deg, ${v.tone}22 0 9px, ${v.tone}10 9px 18px)`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ position: "absolute", top: 9, insetInlineStart: 9, background: "#102A40", color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{v.course}</span>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(16,42,64,.18)" }}><Icon name="play_arrow" size={26} color="#1E8378" /></div>
                <span style={{ position: "absolute", bottom: 9, insetInlineEnd: 9, background: "rgba(16,42,64,.82)", color: "#fff", fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 6 }}>{v.length}</span>
              </div>
              <div style={{ padding: "13px 15px" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-strong)", lineHeight: 1.3 }}>{v.title}</div>
                <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}><Icon name="smart_display" size={14} />{v.source}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="serif" style={{ fontSize: 21, fontWeight: 600, color: "var(--ink-strong)" }}>{t.tutors}</div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>{t.tutorsSub}</div>
        <div style={{ display: "grid", gridTemplateColumns: grid, gap: 14 }}>
          {tts.map((tu, i) => (
            <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 16, background: "var(--surface)", display: "flex", alignItems: "center", gap: 13 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: tu.av, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{tu.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-strong)" }}>{tu.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tu.focus}</div>
                <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 3, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3, color: "#C9892F" }}><Icon name="star" size={14} />{tu.rating}</span>
                  <span>{tu.sessionsLabel}</span>
                </div>
              </div>
              <button style={{ background: "#102A40", color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>{t.book}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
