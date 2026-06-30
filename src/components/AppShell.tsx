"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n, langSwitchLabel } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { Icon, Logo, useIsMobile } from "@/components/ui";
import { AdvisorChat } from "@/components/AdvisorChat";
import { initialsOf, computePlan, programTotalCredits, resolvePlanCourses } from "@/lib/catalog";

type NavDef = { key: string; route: string; label: string; icon: string };

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { t, lang, toggleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const { unreadCount, notifications, markAllRead, openNotification, completed, programCourses } = useData();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const ar = lang === "ar";
  const [showNotif, setShowNotif] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAdvisor, setShowAdvisor] = useState(false);

  const isAdmin = profile?.role === "admin";
  const name = profile?.username || "Student";
  const firstName = name.split(" ")[0];
  const initials = initialsOf(name);

  // progress to graduation (the "come back" hook)
  const major = profile?.major || "Computer Science";
  const planCourses = useMemo(() => resolvePlanCourses(programCourses, major), [programCourses, major]);
  const total = useMemo(() => programTotalCredits(major, programCourses), [major, programCourses]);
  const plan = useMemo(() => computePlan(planCourses, completed, lang, t, total), [planCourses, completed, lang, t, total]);

  // everyday nav (trimmed + simple)
  const mainNav: NavDef[] = [
    { key: "dashboard", route: "/dashboard", label: ar ? "الرئيسية" : "Home", icon: "space_dashboard" },
    { key: "courses", route: "/courses", label: ar ? "خطتي" : "My Plan", icon: "map" },
    { key: "calendar", route: "/calendar", label: ar ? "التقويم" : "Calendar", icon: "calendar_month" },
    { key: "grades", route: "/grades", label: ar ? "درجاتي" : "Grades", icon: "grade" },
    { key: "resources", route: "/resources", label: ar ? "المصادر" : "Resources", icon: "smart_display" },
    { key: "notes", route: "/notes", label: ar ? "ملاحظاتي" : "Notes", icon: "edit_note" },
  ];
  // secondary (used less often)
  const secondaryNav: NavDef[] = [
    { key: "upload", route: "/upload", label: ar ? "رفع الكشف" : "Upload sheet", icon: "upload_file" },
  ];
  if (isAdmin) secondaryNav.push({ key: "admin", route: "/admin", label: ar ? "الإدارة" : "Admin", icon: "admin_panel_settings" });

  const titles: Record<string, string> = {
    "/dashboard": ar ? "لوحة التحكم" : "Dashboard",
    "/courses": ar ? "خطة الدراسة" : "My Plan",
    "/grades": t.title_grades,
    "/resources": t.title_resources,
    "/notes": t.title_notes,
    "/calendar": ar ? "التقويم" : "Calendar",
    "/upload": t.title_upload,
    "/chat": ar ? "المرشد الذكي" : "AI Advisor",
    "/notifications": ar ? "الإشعارات" : "Notifications",
    "/admin": t.title_admin,
  };
  const pageTitle = titles[pathname] ?? "UNI Path";

  const mobileNav = ["dashboard", "courses", "calendar", "grades", "notes"].map((k) => mainNav.find((n) => n.key === k)!).filter(Boolean);

  const notifIconStyle: Record<string, [string, string]> = {
    school: ["#E6F2EF", "#1E8378"], event_available: ["#EAF1F7", "#2C6E91"],
    campaign: ["#F4EAE0", "#B5762E"], auto_awesome: ["#EAF1F7", "#2C6E91"],
  };

  const go = (route: string) => { setShowNotif(false); setShowMenu(false); router.push(route); };

  // shared sidebar inner (used by desktop sidebar + mobile drawer)
  const navButton = (n: NavDef, small = false) => {
    const active = pathname === n.route;
    return (
      <button key={n.key} onClick={() => go(n.route)} style={{ display: "flex", alignItems: "center", gap: 12, padding: small ? "9px 12px" : "11px 12px", border: "none", borderRadius: 11, fontSize: small ? 13 : 14, fontWeight: active ? 600 : 500, textAlign: "start", color: active ? "#fff" : small ? "#9fb3c2" : "#cdd9e2", background: active ? "rgba(30,131,120,.92)" : "transparent" }}>
        <Icon name={n.icon} size={small ? 19 : 21} color={active ? "#fff" : "#7e97a8"} />
        <span style={{ flex: 1, textAlign: "start" }}>{n.label}</span>
      </button>
    );
  };

  const progressWidget = (
    <button onClick={() => go("/dashboard")} style={{ width: "100%", textAlign: "start", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 13, padding: "12px 13px", marginBottom: 14, cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9fb3c2", fontWeight: 600 }}>🎓 {ar ? "رحلتي" : "My journey"}</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{plan.pct}%</span>
      </div>
      <div style={{ height: 7, borderRadius: 5, background: "rgba(255,255,255,.13)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${plan.pct}%`, background: "linear-gradient(90deg,#1E8378,#6BD3A8)", borderRadius: 5, transition: "width .6s ease" }} />
      </div>
      <div style={{ fontSize: 11, color: "#9fb3c2", marginTop: 7 }}>{plan.doneCredits}/{total} {ar ? "ساعة" : "cr"} · {ar ? "التخرّج" : "grad"} {plan.gradTerm}</div>
    </button>
  );

  const userFooter = (
    <div style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 14, marginTop: 10, display: "flex", alignItems: "center", gap: 11 }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#1E8378", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ar ? `أهلاً ${firstName} 👋` : `Hi ${firstName} 👋`}</div>
        <div style={{ fontSize: 11.5, color: "#9fb3c2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile?.university || "—"}</div>
      </div>
      <button onClick={async () => { await signOut(); router.replace("/login"); }} title={t.signOut} style={{ background: "none", border: "none", color: "#7e97a8", display: "flex", padding: 6, flexShrink: 0 }}>
        <Icon name="logout" size={20} />
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100dvh", width: "100%", overflow: "hidden", background: "var(--bg)", color: "var(--text)" }}>
      {/* desktop sidebar */}
      {!isMobile && (
        <aside style={{ width: 248, flexShrink: 0, background: "#102A40", color: "#eaf1f6", display: "flex", flexDirection: "column", padding: "20px 14px" }}>
          <div style={{ padding: "6px 8px 18px" }}>
            <Logo size={34} radius={10} textSize={17} light />
          </div>
          {progressWidget}
          <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, overflowY: "auto" }}>
            {mainNav.map((n) => navButton(n))}
            <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "12px 8px" }} />
            {secondaryNav.map((n) => navButton(n, true))}
          </nav>
          {userFooter}
        </aside>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* header */}
        <header style={{ minHeight: 64, flexShrink: 0, background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, paddingInline: 16, paddingTop: "env(safe-area-inset-top)" }}>
          {isMobile && (
            <button onClick={() => setShowMenu(true)} aria-label="Menu" style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)", flexShrink: 0 }}>
              <Icon name="menu" size={22} />
            </button>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="serif" style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-strong)", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pageTitle}</div>
          </div>
          <button onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Dark mode"} aria-label="Toggle theme" style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)" }}>
            <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} size={20} />
          </button>
          <button onClick={toggleLang} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 9, padding: "7px 11px", color: "var(--text)", fontWeight: 600, fontSize: 12.5 }}>
            <Icon name="translate" size={18} />{!isMobile && langSwitchLabel(lang)}
          </button>
          <button onClick={() => setShowNotif((s) => !s)} aria-label="Notifications" style={{ position: "relative", width: 40, height: 40, borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)" }}>
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
          <nav style={{ flexShrink: 0, background: "var(--surface)", borderTop: "1px solid var(--border)", display: "flex", paddingTop: 7, paddingInline: 4, paddingBottom: "calc(9px + env(safe-area-inset-bottom))" }}>
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

      {/* mobile full-navigation drawer */}
      {showMenu && (
        <div onClick={() => setShowMenu(false)} style={{ position: "fixed", inset: 0, background: "rgba(16,42,64,.4)", zIndex: 50 }}>
          <aside onClick={(e) => e.stopPropagation()} style={{ position: "absolute", insetInlineStart: 0, top: 0, bottom: 0, width: 270, maxWidth: "82vw", background: "#102A40", color: "#eaf1f6", display: "flex", flexDirection: "column", padding: "calc(18px + env(safe-area-inset-top)) 14px 16px", boxShadow: "0 0 50px rgba(0,0,0,.4)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 16px" }}>
              <Logo size={32} radius={9} textSize={16} light />
              <button onClick={() => setShowMenu(false)} aria-label="Close" style={{ background: "none", border: "none", color: "#9fb3c2", display: "flex", padding: 4 }}><Icon name="close" size={22} /></button>
            </div>
            {progressWidget}
            <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, overflowY: "auto" }}>
              {mainNav.map((n) => navButton(n))}
              <div style={{ height: 1, background: "rgba(255,255,255,.08)", margin: "12px 8px" }} />
              {secondaryNav.map((n) => navButton(n, true))}
              {navButton({ key: "notifications", route: "/notifications", label: ar ? "الإشعارات" : "Notifications", icon: "notifications" }, true)}
            </nav>
            {userFooter}
          </aside>
        </div>
      )}

      {/* notification dropdown */}
      {showNotif && (
        <div onClick={() => setShowNotif(false)} style={{ position: "fixed", inset: 0, background: "rgba(16,42,64,.18)", zIndex: 40 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 62, insetInlineEnd: 18, width: 360, maxWidth: "calc(100vw - 36px)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 20px 50px rgba(16,42,64,.22)", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 18px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink-strong)" }}>{t.notifsTitle}</div>
              <button onClick={markAllRead} style={{ background: "none", border: "none", color: "#1E8378", fontWeight: 600, fontSize: 12 }}>{t.markAllRead}</button>
            </div>
            <div style={{ maxHeight: 380, overflowY: "auto" }}>
              {notifications.slice(0, 8).map((n) => {
                const ic = notifIconStyle[n.icon] || ["#F4EEE3", "#6E7C86"];
                return (
                  <button key={n.id} onClick={() => { openNotification(n); if (n.link) go("/" + n.link); else setShowNotif(false); }} style={{ display: "flex", gap: 11, alignItems: "center", padding: "13px 16px", border: "none", borderBottom: "1px solid var(--border)", background: !n.read ? "rgba(30,131,120,.06)" : "var(--surface)", width: "100%" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: ic[0], color: ic[1], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={n.icon} size={19} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: "start" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--ink-strong)" }}>{n.title}</div>
                      <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 3 }}>{relTime(n.created_at, lang)}</div>
                    </div>
                    {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1E8378", flexShrink: 0 }} />}
                  </button>
                );
              })}
              {notifications.length === 0 && (
                <div style={{ padding: 24, textAlign: "center", color: "var(--faint)", fontSize: 13 }}>—</div>
              )}
            </div>
            <button onClick={() => go("/notifications")} style={{ width: "100%", padding: 13, background: "var(--surface-2)", border: "none", borderTop: "1px solid var(--border)", color: "var(--ink-strong)", fontWeight: 600, fontSize: 13 }}>{t.viewAllNotifs}</button>
          </div>
        </div>
      )}

      {/* floating AI advisor — available on every page */}
      {pathname !== "/chat" && !showAdvisor && (
        <button
          onClick={() => setShowAdvisor(true)}
          aria-label={ar ? "المرشد الذكي" : "AI Advisor"}
          className="advisor-fab"
          style={{
            position: "fixed",
            insetInlineEnd: isMobile ? 16 : 24,
            bottom: isMobile ? "calc(76px + env(safe-area-inset-bottom))" : 26,
            width: 58,
            height: 58,
            borderRadius: 29,
            border: "none",
            background: "linear-gradient(135deg, #1E8378, #2C6E91)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 26px rgba(30,131,120,.45)",
            zIndex: 60,
            cursor: "pointer",
          }}
        >
          <Icon name="auto_awesome" size={27} />
        </button>
      )}

      {/* advisor popup */}
      {showAdvisor && (
        <div
          onClick={() => setShowAdvisor(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(16,42,64,.32)", zIndex: 70, display: "flex", alignItems: isMobile ? "stretch" : "flex-end", justifyContent: isMobile ? "stretch" : "flex-end", padding: isMobile ? 0 : 22 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fade-up"
            style={
              isMobile
                ? { width: "100%", height: "100%", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)", background: "var(--bg)" }
                : { width: 400, maxWidth: "calc(100vw - 44px)", height: 620, maxHeight: "calc(100vh - 44px)", borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 60px rgba(16,42,64,.32)" }
            }
          >
            <AdvisorChat onClose={() => setShowAdvisor(false)} />
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
