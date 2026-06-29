"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/data";
import { Icon } from "@/components/ui";
import { relTime } from "@/components/AppShell";

const ICONS: Record<string, [string, string]> = {
  school: ["#E6F2EF", "#1E8378"], event_available: ["#EAF1F7", "#2C6E91"],
  campaign: ["#F4EAE0", "#B5762E"], auto_awesome: ["#EEE7F4", "#7A5AA8"],
};

export default function NotificationsPage() {
  const { t, lang } = useI18n();
  const { notifications, markAllRead, openNotification } = useData();
  const router = useRouter();

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }} className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="serif" style={{ fontSize: 23, fontWeight: 600, color: "var(--ink-strong)" }}>{t.notifsTitle}</div>
        <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#1E8378", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="done_all" size={17} />{t.markAllRead}
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifications.map((n) => {
          const ic = ICONS[n.icon] || ["var(--bg)", "#6E7C86"];
          return (
            <button key={n.id} onClick={() => { openNotification(n); if (n.link) router.push("/" + n.link); }} style={{ display: "flex", gap: 13, alignItems: "flex-start", padding: "15px 16px", border: `1px solid ${!n.read ? "#CDE0EC" : "var(--border)"}`, borderRadius: 13, background: !n.read ? "#F5FAFC" : "#fff", width: "100%" }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: ic[0], color: ic[1], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={n.icon} size={22} /></div>
              <div style={{ flex: 1, minWidth: 0, textAlign: "start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-strong)" }}>{n.title}</span>
                  {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1E8378" }} />}
                </div>
                {n.body && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{n.body}</div>}
                <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 5 }}>{relTime(n.created_at, lang)}</div>
              </div>
            </button>
          );
        })}
        {notifications.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--faint)", fontSize: 13 }}>—</div>
        )}
      </div>
    </div>
  );
}
