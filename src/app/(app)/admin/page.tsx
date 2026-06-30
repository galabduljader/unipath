"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useAuth, type Profile } from "@/lib/auth";
import { Icon } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { initialsOf } from "@/lib/catalog";

const AV = ["#1E8378", "#2C6E91", "#2C6E91", "#C2566A", "#B5762E", "#102A40"];

export default function AdminPage() {
  const { t } = useI18n();
  const { profile, user } = useAuth();
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "admin">("all");

  useEffect(() => {
    if (profile && profile.role !== "admin") { router.replace("/dashboard"); return; }
    if (profile?.role === "admin") {
      supabase.from("profiles").select("*").order("created_at").then(({ data }) => setUsers((data as Profile[]) ?? []));
    }
  }, [profile, supabase, router]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) =>
      (roleFilter === "all" || u.role === roleFilter) &&
      ((u.username || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q))
    );
  }, [users, search, roleFilter]);

  async function toggleDisabled(u: Profile) {
    const next = !u.disabled;
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, disabled: next } : x)));
    await supabase.from("profiles").update({ disabled: next }).eq("id", u.id);
    if (user) await supabase.from("audit_log").insert({ actor_id: user.id, action: next ? "disable_user" : "enable_user", target_user_id: u.id, detail: u.email });
  }

  const stats = [
    { value: String(users.length), label: t.totalUsers },
    { value: String(users.filter((u) => !u.disabled).length), label: t.activeAccounts },
    { value: String(users.filter((u) => u.role === "admin").length), label: t.admins },
  ];
  const roleFilters: { key: "all" | "student" | "admin"; label: string }[] = [
    { key: "all", label: t.allRoles }, { key: "student", label: t.student }, { key: "admin", label: t.admin },
  ];

  if (profile && profile.role !== "admin") return null;

  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }} className="fade-up">
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {stats.map((s, i) => (
          <div key={i} style={{ flex: 1, minWidth: 150, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.label}</div>
            <div className="serif" style={{ fontSize: 30, fontWeight: 600, color: "var(--ink-strong)", marginTop: 3 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 12, padding: "18px 20px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span className="msym" style={{ position: "absolute", insetInlineStart: 12, top: "50%", transform: "translateY(-50%)", fontSize: 19, color: "var(--faint)" }}>search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchUsers} style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", paddingInlineStart: 38, fontSize: 13.5, outline: "none", color: "var(--text)", background: "var(--surface-2)" }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {roleFilters.map((r) => {
              const active = roleFilter === r.key;
              return <button key={r.key} onClick={() => setRoleFilter(r.key)} style={{ border: `1px solid ${active ? "#102A40" : "var(--border)"}`, background: active ? "#102A40" : "#fff", color: active ? "#fff" : "#42525C", borderRadius: 9, padding: "9px 14px", fontSize: 12.5, fontWeight: 600 }}>{r.label}</button>;
            })}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 680 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1.6fr 1fr 1.1fr", gap: 12, padding: "11px 20px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)", fontSize: 11.5, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>
              <div>{t.colUser}</div><div>{t.role}</div><div>{t.program}</div><div>{t.joined}</div><div style={{ textAlign: "end" }}>{t.status}</div>
            </div>
            {filtered.map((u, idx) => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1.6fr 1fr 1.1fr", gap: 12, padding: "13px 20px", borderBottom: "1px solid #F0EADE", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: AV[idx % AV.length], color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{initialsOf(u.username || u.email || "U")}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.username || "—"}</div>
                    <div style={{ fontSize: 11.5, color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                  </div>
                </div>
                <div><span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 7, color: u.role === "admin" ? "#2C6E91" : "#2C6E91", background: u.role === "admin" ? "#EAF1F7" : "#EAF1F7" }}>{u.role === "admin" ? t.admin : t.student}</span></div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.major || "—"}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{u.cohort || "—"}</div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={() => toggleDisabled(u)} style={{ border: `1px solid ${u.disabled ? "#E7CFCF" : "#CDE6E0"}`, background: u.disabled ? "#FBF0F0" : "#F2FAF8", color: u.disabled ? "#B5564E" : "#156B61", borderRadius: 20, padding: "5px 12px", fontSize: 11.5, fontWeight: 600 }}>{u.disabled ? t.disabled : t.active}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "12px 20px", fontSize: 11.5, color: "var(--faint)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="history" size={15} />{t.auditNote}</div>
      </div>
    </div>
  );
}
