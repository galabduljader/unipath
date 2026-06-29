"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n, langSwitchLabel } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { Icon, Logo, useIsMobile } from "@/components/ui";
import { initialsOf } from "@/lib/catalog";

type NavDef = { key: string; route: string; label: string; icon: string };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { t, lang, toggleLang } = useI18n();
  const { profile, signOut } = useAuth();
  const { unreadCount, notifications, markAllRead, openNotification } = useData();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const [showNotif, setShowNotif] = useState(false);

  const isAdmin = profile?.role === "admin";
  const name = profile?.username || "Student";
  const initials = initialsOf(name);

  const navDefs: NavDef[] = [
    { key: "dashboard", route: "/dashboard", label: lang === "ar" ? "لوحة التحكم" : "Dashboard", icon: "space_dashboard" },
    { key: "courses", route: "/courses", label: lang === "ar" ? "خطة الدراسة" : "My Plan", icon: "menu_book" },
    { key: "grades", route: "/grades", label: t.navGrades, icon: "grade" },
    { key: "resources", route: "/resources", label: t.navResources, icon: "smart_display" },
    { key: "notes", route: "/notes", label: t.navNotes, icon: "edit_note" },
    { key: "calendar", route: "/calendar", label: lang === "ar" ? "التقويم" : "Calendar", icon: "calendar_month" },
    { key: "chat", route: "/chat", label: lang === "ar" ? "المرشد الذكي" : "AI Advisor", icon: "auto_awesome" },
    { key: "upload", route: "/upload", label: lang === "ar" ? "رفع الخطة" : "Upload Sheet", icon: "upload_file" },
    { key: "notifications", route: "/notifications", label: lang === "ar" ? "الإشعارات" : "Notifications", icon: "notifications" },
  ];
  if (isAdmin) navDefs.push({ key: "admin", route: "/admin", label: lang === "ar" ? "الإدارة" : "Admin", icon: "admin_panel_settings" });

  const titles: Record<string, string> = {
    "/dashboard": lang === "ar" ? "لوحة التحكم" : "Dashboard",
    "/courses": lang === "ar" ? "خطة الدراسة" : "My Plan",
    "/grades": t.title_grades,
    "/resources": t.title_resources,
    "/notes": t.title_notes,
    "/calendar": lang === "ar" ? "التقويم" : "Calendar",
    "/upload": t.title_upload,
    "/chat": lang === "ar" ? "المرشد الذكي" : "AI Advisor",
    "/notifications": lang === "ar" ? "الإشعارات" : "Notifications",
    "/admin": t.title_admin,
  };
  const pageTitle = titles[pathname] ?? "UNI Path";

  const mobKeys = ["dashboard", "courses", "calendar", "grades", "chat"];
  const mobileNav = mobKeys.map((k) => navDefs.find((n) => n.key === k)!).filter(Boolean);

  const notifIconStyle: Record<string, [string, string]> = {
    school: ["#E6F2EF", "#1E8378"], event_available: ["#EAF1F7", "#2C6E91"],
    campaign: ["#F4EAE0", "#B5762E"], auto_awesome: ["#EEE7F4", "#7A5AA8"],
  };

  const go = (route: string) => { setShowNotif(false); router.push(route); };

  return (
    <div style={{ display: "flex", height: "100dvh", width: "100%", overflow: "hidden", background: "#F4EEE3", color: "#15324B" }}>
      {/* sidebar */}
      {!isMobile && (
        <aside style={{ width: 256, flexShrink: 0, background: "#102A40", color: "#eaf1f6", display: "flex", flexDirection: "column", padding: "22px 16px" }}>
          <div style={{ padding: "6px 8px 22px" }}>
            <Logo size={36} radius={10} textSize={17} light />
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, overflowY: "auto" }}>
            {navDefs.map((n) => {
              const active = pathname === n.route;
              return (
                <button key={n.key} onClick={() => go(n.route)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: "none", borderRadius: 10, fontSize: 13.5, fontWeight: active ? 600 : 500, textAlign: "start", color: active ? "#fff" : "#cdd9e2", background: active ? "rgba(30,131,120,.9)" : "transparent" }}>
                  <Icon name={n.icon} size={21} color={active ? "#fff" : "#7e97a8"} />
                  <span style={{ flex: 1, textAlign: "start" }}>{n.label}</span>
                  {n.key === "notifications" && unreadCount > 0 && (
                    <span style={{ background: "#1E8378", color: "#fff", fontSize: 11, fontWeight: 700, minWidth: 19, height: 19, padding: "0 5px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount}</span>
                  )}
                </button>
              );
            })}
          </nav>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 14, marginTop: 10, display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#1E8378", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
              <div style={{ fontSize: 11.5, color: "#9fb3c2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.university || "—"}</div>
            </div>
            <button onClick={async () => { await signOut(); router.replace("/login"); }} title={t.signOut} style={{ background: "none", border: "none", color: "#7e97a8", display: "flex", padding: 6, flexShrink: 0 }}>
              <Icon name="logout" size={20} />
            </button>
          </div>
        </aside>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* header */}
        <header style={{ minHeight: 64, flexShrink: 0, background: "#fff", borderBottom: "1px solid #E7E0D3", display: "flex", alignItems: "center", gap: 14, paddingInline: 16, paddingTop: "env(safe-area-inset-top)" }}>
          {isMobile && <Logo size={30} radius={8} textSize={15} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600, color: "#102A40", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pageTitle}</div>
          </div>
          <button onClick={toggleLang} style={{ display: "flex", alignItems: "center", gap: 6, background: "#F4EEE3", border: "1px solid #E7E0D3", borderRadius: 9, padding: "7px 11px", color: "#15324B", fontWeight: 600, fontSize: 12.5 }}>
            <Icon name="translate" size={18} />{!isMobile && langSwitchLabel(lang)}
          </button>
          <button onClick={() => setShowNotif((s) => !s)} style={{ position: "relative", width: 40, height: 40, borderRadius: 10, background: "#F4EEE3", border: "1px solid #E7E0D3", display: "flex", alignItems: "center", justifyContent: "center", color: "#15324B" }}>
            <Icon name="notifications" size={21} />
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: 6, insetInlineEnd: 7, minWidth: 16, height: 16, background: "#C9512F", color: "#fff", borderRadius: 8, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff", padding: "0 3px" }}>{unreadCount}</span>
            )}
          </button>
          {!isMobile && (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#102A40", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{initials}</div>
          )}
        </header>

        <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
          <div style={{ padding: isMobile ? "18px 14px 22px" : "26px 30px 36px" }}>{children}</div>
        </main>

        {/* mobile bottom nav */}
        {isMobile && (
          <nav style={{ flexShrink: 0, background: "#fff", borderTop: "1px solid #E7E0D3", display: "flex", paddingTop: 7, paddingInline: 4, paddingBottom: "calc(9px + env(safe-area-inset-bottom))" }}>
            {mobileNav.map((n) => {
              const active = pathname === n.route;
              return (
                <button key={n.key} onClick={() => go(n.route)} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: 4, color: active ? "#1E8378" : "#9aa6ad" }}>
                  <Icon name={n.icon} size={23} />
                  <span style={{ fontSize: 10, fontWeight: 600 }}>{n.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* notification dropdown */}
      {showNotif && (
        <div onClick={() => setShowNotif(false)} style={{ position: "fixed", inset: 0, background: "rgba(16,42,64,.18)", zIndex: 40 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 62, insetInlineEnd: 18, width: 360, maxWidth: "calc(100vw - 36px)", background: "#fff", border: "1px solid #E7E0D3", borderRadius: 16, boxShadow: "0 20px 50px rgba(16,42,64,.22)", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 18px", borderBottom: "1px solid #E7E0D3" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#102A40" }}>{t.notifsTitle}</div>
              <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#1E8378", fontWeight: 600, fontSize: 12 }}>{t.markAllRead}</button>
            </div>
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {notifications.slice(0, 8).map((n) => {
                const ic = notifIconStyle[n.icon] || ["#F4EEE3", "#6E7C86"];
                return (
                  <button key={n.id} onClick={() => { openNotification(n); if (n.link) go("/" + n.link); else setShowNotif(false); }} style={{ display: "flex", gap: 11, alignItems: "center", padding: "13px 16px", border: "none", borderBottom: "1px solid #F0EADE", background: !n.read ? "#F5FAFC" : "#fff", width: "100%" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: ic[0], color: ic[1], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={n.icon} size={19} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: "start" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#102A40" }}>{n.title}</div>
                      <div style={{ fontSize: 11.5, color: "#9aa6ad", marginTop: 3 }}>{relTime(n.created_at, lang)}</div>
                    </div>
                    {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1E8378", flexShrink: 0 }} />}
                  </button>
                );
              })}
              {notifications.length === 0 && (
                <div style={{ padding: 24, textAlign: "center", color: "#9aa6ad", fontSize: 13 }}>—</div>
              )}
            </div>
            <button onClick={() => go("/notifications")} style={{ width: "100%", padding: 13, background: "#FBFAF6", border: "none", borderTop: "1px solid #E7E0D3", color: "#102A40", fontWeight: 600, fontSize: 13 }}>{t.viewAllNotifs}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function relTime(iso: string, lang: "en" | "ar"): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3.6e6);
  const d = Math.floor(h / 24);
  if (lang === "ar") {
    if (d >= 1) return `قبل ${d} يوم`;
    if (h >= 1) return `قبل ${h} ساعة`;
    return "الآن";
  }
  if (d >= 1) return `${d}d ago`;
  if (h >= 1) return `${h}h ago`;
  return "just now";
}
